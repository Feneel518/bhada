import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { landlord, saasBillingEvent } from "@/db/schema";

export type SubscriptionReceipt = {
  receiptNumber: string;
  paymentId: string;
  subscriptionId: string;
  amountPaise: number;
  currency: string;
  status: string;
  paidAt: string;
};

export async function getSubscriptionReceipts(userId: string) {
  const rows = await db
    .select({
      paymentId: saasBillingEvent.id,
      subscriptionId: saasBillingEvent.subscriptionId,
      amountPaise: saasBillingEvent.amountPaise,
      currency: saasBillingEvent.currency,
      status: saasBillingEvent.status,
      paidAt: saasBillingEvent.occurredAt,
    })
    .from(saasBillingEvent)
    .innerJoin(landlord, eq(saasBillingEvent.landlordId, landlord.id))
    .where(
      and(
        eq(landlord.userId, userId),
        eq(saasBillingEvent.eventType, "payment.captured"),
      ),
    )
    .orderBy(desc(saasBillingEvent.occurredAt));

  return rows.map<SubscriptionReceipt>((row) => ({
    receiptNumber: `BHADA-${row.paymentId.slice(4).toUpperCase()}`,
    paymentId: row.paymentId,
    subscriptionId: row.subscriptionId ?? "",
    amountPaise: row.amountPaise,
    currency: row.currency,
    status: row.status ?? "captured",
    paidAt: row.paidAt.toISOString(),
  }));
}
