import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { landlord } from "@/db/schema";
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
  payload?: {
    subscription?: {
      entity?: RazorpaySubscription;
    };
  };
};

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
  if (!body.event?.startsWith("subscription.") || !subscription?.id) {
    return Response.json({ received: true });
  }

  try {
    const { planId } = razorpayConfig();
    if (subscription.plan_id !== planId) {
      return Response.json({ received: true });
    }

    await db
      .update(landlord)
      .set({
        plan: subscriptionPlan(subscription.status),
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
        updatedAt: new Date(),
      })
      .where(eq(landlord.razorpaySubscriptionId, subscription.id));

    revalidatePath("/");
    revalidatePath("/dashboard");
    return Response.json({ received: true });
  } catch (error) {
    console.error("Unable to process Razorpay webhook", error);
    return Response.json({ message: "Webhook processing failed." }, { status: 500 });
  }
}
