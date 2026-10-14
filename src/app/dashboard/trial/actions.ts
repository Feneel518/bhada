"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";
import { db } from "@/db";
import { landlord, saasBillingEvent } from "@/db/schema";

export async function startPortfolioTrial() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, message: "Please sign in again to start your trial." };
  try {
    const owner = await ensureLandlord(session.user);
    const trialId = `portfolio_trial_${owner.id}`;
    const started = await db.insert(saasBillingEvent).select(
      db.select({
        id: sql<string>`${trialId}`.as("id"),
        landlordId: landlord.id,
        provider: sql<string>`'bhada'`.as("provider"),
        eventType: sql<string>`'portfolio.trial_started'`.as("eventType"),
        subscriptionId: sql<string>`null`.as("subscriptionId"),
        amountPaise: sql<number>`0`.as("amountPaise"),
        currency: sql<string>`'INR'`.as("currency"),
        status: sql<string>`'started'`.as("status"),
        occurredAt: sql<Date>`now()`.as("occurredAt"),
        createdAt: sql<Date>`now()`.as("createdAt"),
      }).from(landlord).where(and(eq(landlord.id, owner.id), eq(landlord.plan, "one_door"),
        eq(landlord.subscriptionStatus, "none"), isNull(landlord.razorpaySubscriptionId),
        sql`not exists(select 1 from saas_billing_event paid where paid.landlord_id = ${owner.id} and paid.event_type = 'payment.captured' and paid.amount_paise > 0)`)),
    ).onConflictDoNothing({ target: saasBillingEvent.id }).returning({ id: saasBillingEvent.id });
    if (!started.length) return { ok: false, message: "This account has already used a trial or has a subscription. Refresh to see your current plan." };
    revalidatePath("/dashboard");
    return { ok: true, message: "Your 7-day Portfolio trial has started. No card required." };
  } catch {
    return { ok: false, message: "Couldn't start your trial. Please try again." };
  }
}
