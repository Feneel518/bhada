import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord, saasBillingEvent } from "@/db/schema";
import {
  hmacHex,
  razorpayConfig,
  razorpayRequest,
  safeEqualHex,
  subscriptionPeriodEnd,
  subscriptionPlan,
  type RazorpayPayment,
  type RazorpaySubscription,
} from "@/lib/razorpay";

type VerificationBody = {
  razorpay_payment_id?: unknown;
  razorpay_subscription_id?: unknown;
  razorpay_signature?: unknown;
};

function identifier(value: unknown, prefix: string) {
  return typeof value === "string" && value.startsWith(prefix) && value.length <= 100
    ? value
    : null;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ message: "Your session has expired." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as VerificationBody | null;
  const paymentId = identifier(body?.razorpay_payment_id, "pay_");
  const subscriptionId = identifier(body?.razorpay_subscription_id, "sub_");
  const signature = typeof body?.razorpay_signature === "string"
    ? body.razorpay_signature
    : "";
  if (!paymentId || !subscriptionId || !/^[a-f0-9]{64}$/i.test(signature)) {
    return Response.json({ message: "Invalid payment response." }, { status: 400 });
  }

  const [account] = await db
    .select({ id: landlord.id })
    .from(landlord)
    .where(eq(landlord.userId, session.user.id))
    .limit(1);
  if (!account) {
    return Response.json({ message: "Billing account not found." }, { status: 404 });
  }

  const [ownedSubscription] = await db
    .select({ id: landlord.id })
    .from(landlord)
    .where(eq(landlord.razorpaySubscriptionId, subscriptionId))
    .limit(1);
  if (ownedSubscription?.id !== account.id) {
    return Response.json({ message: "Subscription does not belong to this account." }, { status: 403 });
  }

  try {
    const { keySecret, planId } = razorpayConfig();
    const expected = await hmacHex(keySecret, `${paymentId}|${subscriptionId}`);
    if (!safeEqualHex(expected, signature)) {
      return Response.json({ message: "Payment verification failed." }, { status: 400 });
    }

    const [subscription, payment] = await Promise.all([
      razorpayRequest<RazorpaySubscription>(`/subscriptions/${subscriptionId}`),
      razorpayRequest<RazorpayPayment>(`/payments/${paymentId}`),
    ]);
    if (subscription.plan_id !== planId) {
      return Response.json({ message: "Unexpected subscription plan." }, { status: 400 });
    }
    if (
      payment.id !== paymentId
      || (!payment.captured && payment.status !== "captured")
    ) {
      return Response.json({ message: "Payment has not been captured yet." }, { status: 409 });
    }

    await db.batch([
      db
        .update(landlord)
        .set({
          plan: subscriptionPlan(subscription.status),
          subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
          subscriptionCancelAtPeriodEnd: Boolean(subscription.has_scheduled_changes),
          updatedAt: new Date(),
        })
        .where(eq(landlord.id, account.id)),
      db
        .insert(saasBillingEvent)
        .values({
          id: payment.id,
          landlordId: account.id,
          eventType: "payment.captured",
          subscriptionId,
          amountPaise: Math.max(0, Math.round(payment.amount)),
          currency: payment.currency || "INR",
          status: payment.status,
          occurredAt: new Date(payment.created_at * 1_000),
        })
        .onConflictDoNothing({ target: saasBillingEvent.id }),
    ]);

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/owner");
    return Response.json({
      message: "Portfolio is now active.",
      receipt: {
        receiptNumber: `BHADA-${payment.id.slice(4).toUpperCase()}`,
        paymentId: payment.id,
        subscriptionId,
        amountPaise: Math.max(0, Math.round(payment.amount)),
        currency: payment.currency || "INR",
        status: payment.status,
        paidAt: new Date(payment.created_at * 1_000).toISOString(),
        customerName: session.user.name,
        customerEmail: session.user.email,
        description: "Bhada Portfolio plan - monthly subscription",
      },
    });
  } catch (error) {
    console.error("Unable to verify Razorpay subscription", error);
    return Response.json({ message: "Unable to verify the subscription." }, { status: 503 });
  }
}
