import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import {
  razorpayConfig,
  razorpayRequest,
  subscriptionPeriodEnd,
  subscriptionPlan,
  type RazorpaySubscription,
} from "@/lib/razorpay";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ message: "Your session has expired." }, { status: 401 });
  }

  const [account] = await db
    .select({
      id: landlord.id,
      razorpaySubscriptionId: landlord.razorpaySubscriptionId,
      subscriptionStatus: landlord.subscriptionStatus,
      subscriptionCancelAtPeriodEnd: landlord.subscriptionCancelAtPeriodEnd,
    })
    .from(landlord)
    .where(eq(landlord.userId, session.user.id))
    .limit(1);

  if (!account?.razorpaySubscriptionId) {
    return Response.json({ message: "No active subscription was found." }, { status: 404 });
  }
  if (account.subscriptionCancelAtPeriodEnd) {
    return Response.json({ message: "Your downgrade is already scheduled." });
  }
  if (!["authenticated", "active", "pending"].includes(account.subscriptionStatus)) {
    return Response.json({ message: "This subscription cannot be cancelled." }, { status: 409 });
  }

  try {
    const { planId } = razorpayConfig();
    const current = await razorpayRequest<RazorpaySubscription>(
      `/subscriptions/${account.razorpaySubscriptionId}`,
    );
    if (current.plan_id !== planId) {
      return Response.json({ message: "Unexpected subscription plan." }, { status: 400 });
    }
    if (!["authenticated", "active", "pending"].includes(current.status)) {
      return Response.json({ message: "This subscription cannot be cancelled." }, { status: 409 });
    }

    const subscription = current.has_scheduled_changes
      ? current
      : await razorpayRequest<RazorpaySubscription>(
          `/subscriptions/${account.razorpaySubscriptionId}/cancel`,
          {
            method: "POST",
            body: JSON.stringify({ cancel_at_cycle_end: true }),
          },
        );

    await db
      .update(landlord)
      .set({
        plan: subscriptionPlan(subscription.status),
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
        subscriptionCancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(landlord.id, account.id));

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/owner");

    const periodEnd = subscriptionPeriodEnd(subscription);
    return Response.json({
      message: periodEnd
        ? `Portfolio will remain active until ${periodEnd.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })}.`
        : "Portfolio will remain active until the end of the current billing cycle.",
      currentPeriodEnd: periodEnd?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Unable to cancel Razorpay subscription", error);
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to schedule the downgrade." },
      { status: 503 },
    );
  }
}
