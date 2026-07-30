import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { landlord, saasBillingEvent } from "@/db/schema";
import {
  hmacHex,
  razorpayConfig,
  safeEqualHex,
  subscriptionPeriodEnd,
  subscriptionPlan,
  type RazorpaySubscription,
} from "@/lib/razorpay";

type WebhookPayload = {
  event?: string;
  created_at?: number;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscription;
    };
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        captured?: boolean;
        created_at?: number;
        subscription_id?: string;
      };
    };
  };
};

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!webhookSecret || !/^[a-f0-9]{64}$/i.test(signature)) {
    return Response.json({ message: "Webhook authentication failed." }, { status: 401 });
  }

  const rawBody = await request.text();
  const expected = await hmacHex(webhookSecret, rawBody);
  if (!safeEqualHex(expected, signature)) {
    return Response.json({ message: "Webhook authentication failed." }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as WebhookPayload;
  const subscription = body.payload?.subscription?.entity;
  const payment = body.payload?.payment?.entity;
  if (!body.event || (!subscription?.id && !payment?.subscription_id)) {
    return Response.json({ received: true });
  }

  try {
    const { planId } = razorpayConfig();
    let account: { id: string } | undefined;
    const subscriptionId = subscription?.id ?? payment?.subscription_id;

    if (subscriptionId) {
      [account] = await db
        .select({ id: landlord.id })
        .from(landlord)
        .where(eq(landlord.razorpaySubscriptionId, subscriptionId))
        .limit(1);
    }

    if (subscription?.id && subscription.plan_id === planId) {
      await db
        .update(landlord)
        .set({
          plan: subscriptionPlan(subscription.status),
          subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
          subscriptionCancelAtPeriodEnd:
            subscription.status === "cancelled"
              ? false
              : Boolean(subscription.has_scheduled_changes),
          updatedAt: new Date(),
        })
        .where(eq(landlord.razorpaySubscriptionId, subscription.id));

      if (account) {
        await db
          .insert(saasBillingEvent)
          .values({
            id: `evt_${await sha256Hex(rawBody)}`,
            landlordId: account.id,
            eventType: body.event,
            subscriptionId: subscription.id,
            status: subscription.status,
            occurredAt: new Date((body.created_at ?? Math.floor(Date.now() / 1_000)) * 1_000),
          })
          .onConflictDoNothing({ target: saasBillingEvent.id });
      }
    }

    if (
      account
      && payment?.id
      && payment.subscription_id
      && (payment.captured || payment.status === "captured")
    ) {
      await db
        .insert(saasBillingEvent)
        .values({
          id: payment.id,
          landlordId: account.id,
          eventType: "payment.captured",
          subscriptionId: payment.subscription_id,
          amountPaise: Math.max(0, Math.round(payment.amount ?? 0)),
          currency: payment.currency ?? "INR",
          status: payment.status ?? "captured",
          occurredAt: new Date(
            (payment.created_at ?? body.created_at ?? Math.floor(Date.now() / 1_000)) * 1_000,
          ),
        })
        .onConflictDoNothing({ target: saasBillingEvent.id });
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/owner");
    return Response.json({ received: true });
  } catch (error) {
    console.error("Unable to process Razorpay webhook", error);
    return Response.json({ message: "Webhook processing failed." }, { status: 500 });
  }
}
