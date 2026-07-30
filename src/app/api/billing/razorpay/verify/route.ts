import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import {
  hmacHex,
  razorpayConfig,
  razorpayRequest,
  safeEqualHex,
  subscriptionPeriodEnd,
  subscriptionPlan,
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

    const subscription = await razorpayRequest<RazorpaySubscription>(
      `/subscriptions/${subscriptionId}`,
    );
    if (subscription.plan_id !== planId) {
      return Response.json({ message: "Unexpected subscription plan." }, { status: 400 });
    }

    await db
      .update(landlord)
      .set({
        plan: subscriptionPlan(subscription.status),
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
        updatedAt: new Date(),
      })
      .where(eq(landlord.id, account.id));

    revalidatePath("/");
    revalidatePath("/dashboard");
    return Response.json({ message: "Portfolio is now active." });
  } catch (error) {
    console.error("Unable to verify Razorpay subscription", error);
    return Response.json({ message: "Unable to verify the subscription." }, { status: 503 });
  }
}
