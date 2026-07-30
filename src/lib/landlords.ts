import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { landlord } from "@/db/schema";

export async function ensureLandlord(user: { id: string; name: string }) {
  const [existing] = await db
    .select({
      id: landlord.id,
      plan: landlord.plan,
      subscriptionStatus: landlord.subscriptionStatus,
      subscriptionCurrentPeriodEnd: landlord.subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: landlord.subscriptionCancelAtPeriodEnd,
    })
    .from(landlord)
    .where(eq(landlord.userId, user.id))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(landlord)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      businessName: user.name,
    })
    .onConflictDoNothing({ target: landlord.userId })
    .returning({
      id: landlord.id,
      plan: landlord.plan,
      subscriptionStatus: landlord.subscriptionStatus,
      subscriptionCurrentPeriodEnd: landlord.subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: landlord.subscriptionCancelAtPeriodEnd,
    });

  if (created) return created;

  const [concurrent] = await db
    .select({
      id: landlord.id,
      plan: landlord.plan,
      subscriptionStatus: landlord.subscriptionStatus,
      subscriptionCurrentPeriodEnd: landlord.subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: landlord.subscriptionCancelAtPeriodEnd,
    })
    .from(landlord)
    .where(eq(landlord.userId, user.id))
    .limit(1);

  if (!concurrent) throw new Error("Unable to create landlord profile.");
  return concurrent;
}
