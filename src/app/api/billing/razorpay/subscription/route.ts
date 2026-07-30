import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import { ensureLandlord } from "@/lib/landlords";
import { hasPortfolioAccess } from "@/lib/plans";
import {
  razorpayConfig,
  razorpayRequest,
  type RazorpaySubscription,
} from "@/lib/razorpay";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ message: "Please sign in to upgrade." }, { status: 401 });
  }

  try {
    const owner = await ensureLandlord(session.user);
    if (hasPortfolioAccess(owner)) {
      return Response.json({ message: "Portfolio is already active." }, { status: 409 });
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
    const { keyId, planId } = razorpayConfig();

    let subscription: RazorpaySubscription | null = null;
    if (
      account?.razorpaySubscriptionId
      && ["created", "authenticated"].includes(account.subscriptionStatus)
    ) {
      subscription = await razorpayRequest<RazorpaySubscription>(
        `/subscriptions/${account.razorpaySubscriptionId}`,
      ).catch(() => null);
      if (
        subscription?.plan_id !== planId
        || !["created", "authenticated"].includes(subscription.status)
      ) {
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          total_count: 120,
          quantity: 1,
          customer_notify: true,
          notes: {
            landlord_id: owner.id,
            user_id: session.user.id,
          },
        }),
      });

      await db
        .update(landlord)
        .set({
          razorpaySubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          plan: "one_door",
          updatedAt: new Date(),
        })
        .where(eq(landlord.id, owner.id));
    }

    return Response.json({
      keyId,
      subscriptionId: subscription.id,
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
