import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { landlord, property, saasBillingEvent, unit } from "@/db/schema";
import { planLimits, TRIAL_DAYS, type PlanAccount } from "@/lib/plans";

// Trial starts live in the existing durable event ledger. A deterministic
// primary key makes activation single-use, including concurrent requests.
export async function withTrial<T extends { id: string }>(account: T) {
  const [event] = await db.select({ startedAt: saasBillingEvent.occurredAt,
    trialRevoked: sql<boolean>`exists(select 1 from saas_billing_event paid where paid.landlord_id = ${account.id} and paid.event_type = 'payment.captured' and paid.amount_paise > 0)`,
  })
    .from(saasBillingEvent)
    .where(and(eq(saasBillingEvent.id, `portfolio_trial_${account.id}`),
      eq(saasBillingEvent.landlordId, account.id),
      eq(saasBillingEvent.eventType, "portfolio.trial_started")))
    .limit(1);
  return {
    ...account,
    trialStartedAt: event?.startedAt ?? null,
    trialRevoked: event?.trialRevoked ?? false,
    trialEndsAt: event ? new Date(event.startedAt.getTime() + TRIAL_DAYS * 86_400_000) : null,
  };
}

export async function getPlanAccount(userId: string) {
  const [account] = await db.select().from(landlord).where(eq(landlord.userId, userId)).limit(1);
  return account ? withTrial(account) : null;
}

export const RENTAL_LOCK_MESSAGE = "This rental is read-only on your current plan. Upgrade to Portfolio to make changes. Your saved records are safe.";

export async function getRentalAccess(account: PlanAccount & { id: string }) {
  const limits = planLimits(account);
  const [properties, units] = await Promise.all([
    db.select({ id: property.id }).from(property)
      .where(eq(property.landlordId, account.id)).orderBy(asc(property.createdAt), asc(property.id)),
    db.select({ id: unit.id, propertyId: unit.propertyId }).from(unit)
      .where(eq(unit.landlordId, account.id)).orderBy(asc(unit.createdAt), asc(unit.id)),
  ]);
  const propertyIds = properties.slice(0, limits.propertyLimit).map((item) => item.id);
  const unitIds = units.filter((item) => propertyIds.includes(item.propertyId))
    .slice(0, limits.unitLimit).map((item) => item.id);
  return { propertyIds, unitIds, hasLockedRentals: properties.length > propertyIds.length || units.length > unitIds.length };
}
