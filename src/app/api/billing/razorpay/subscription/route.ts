import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import { ensureLandlord } from "@/lib/landlords";
import { BILLING_CHOICES, hasPaidPortfolioAccess, isBillingChoice } from "@/lib/plans";
import {
  razorpayConfig,
  razorpayRequest,
  subscriptionPeriodEnd,
  subscriptionPlan,
  type RazorpaySubscription,
} from "@/lib/razorpay";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ message: "Please sign in to upgrade." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { choice?: unknown } | null;
  const choice = isBillingChoice(body?.choice) ? body.choice : "portfolio_monthly";

  try {
    const owner = await ensureLandlord(session.user);
    if (hasPaidPortfolioAccess(owner)) {
      return Response.json({
        message: "You're already on a paid plan. To switch, downgrade in Settings and choose the new plan when this period ends, or email us and we'll switch you now.",
      }, { status: 409 });
    }

    const [account] = await db
      .select({
        razorpaySubscriptionId: landlord.razorpaySubscriptionId,
        subscriptionStatus: landlord.subscriptionStatus,
        businessName: landlord.businessName,
        phone: landlord.phone,
      })
      .from(landlord)
      .where(eq(landlord.id, owner.id))
      .limit(1);
    const { keyId, planIdsByChoice } = razorpayConfig();
    const planId = planIdsByChoice[choice];
    if (!planId) {
      return Response.json({ message: "This plan isn't available yet. Please choose another." }, { status: 400 });
    }

    let subscription: RazorpaySubscription | null = null;
    if (
      account?.razorpaySubscriptionId
    ) {
      subscription = await razorpayRequest<RazorpaySubscription>(
        `/subscriptions/${account.razorpaySubscriptionId}`,
      );
      const knownPlans = Object.values(planIdsByChoice);
      if (!knownPlans.includes(subscription.plan_id)) throw new Error("Unexpected subscription plan.");
      if (["active", "pending", "halted", "paused"].includes(subscription.status)) {
        await db.update(landlord).set({
          plan: subscriptionPlan(subscription.status, subscription.plan_id), subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
          subscriptionCancelAtPeriodEnd: Boolean(subscription.has_scheduled_changes), updatedAt: new Date(),
        }).where(eq(landlord.id, owner.id));
        return Response.json({ message: "You already have a subscription. Refresh your plan settings or resolve the existing payment before starting another." }, { status: 409 });
      }
      // An unpaid checkout for a different plan is simply left to expire.
      if (!["created", "authenticated"].includes(subscription.status) || subscription.plan_id !== planId) subscription = null;
    }

    if (!subscription) {
      subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          // Razorpay needs a finite cycle count: ten years either way.
          total_count: BILLING_CHOICES[choice].interval === "year" ? 10 : 120,
          quantity: 1,
          customer_notify: true,
          notes: {
            landlord_id: owner.id,
            user_id: session.user.id,
            choice,
          },
        }),
      });

      await db
        .update(landlord)
        .set({
          razorpaySubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionCurrentPeriodEnd: null,
          billingInterval: BILLING_CHOICES[choice].interval,
          plan: "one_door",
          updatedAt: new Date(),
        })
        .where(eq(landlord.id, owner.id));
    }

    return Response.json({
      keyId,
      subscriptionId: subscription.id,
      description: BILLING_CHOICES[choice].label,
      name: account?.businessName || session.user.name,
      email: session.user.email,
      contact: account?.phone || undefined,
    });
  } catch (error) {
    console.error("Unable to create Razorpay subscription", error);
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to start checkout." },
      { status: 503 },
    );
  }
}
