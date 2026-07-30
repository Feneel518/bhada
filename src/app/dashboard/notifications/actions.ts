"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { notificationRead } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";

function validKeys(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value)]
    .filter(
      (item): item is string =>
        typeof item === "string" &&
        item.length <= 180 &&
        /^(rent|electricity|tenant):[a-zA-Z0-9-]+:(overdue|due|lease|increase)(?::\d{4}-\d{2}-\d{2})?$/.test(item),
    )
    .slice(0, 50);
}

export async function markNotificationsRead(keys: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false as const, message: "Your session has expired." };

  const notificationKeys = validKeys(keys);
  if (!notificationKeys.length) return { ok: true as const };

  const owner = await ensureLandlord({
    id: session.user.id,
    name: session.user.name,
  });
  const readAt = new Date();

  await db
    .insert(notificationRead)
    .values(
      notificationKeys.map((notificationKey) => ({
        id: crypto.randomUUID(),
        landlordId: owner.id,
        notificationKey,
        readAt,
      })),
    )
    .onConflictDoUpdate({
      target: [notificationRead.landlordId, notificationRead.notificationKey],
      set: { readAt },
    });

  return { ok: true as const };
}
