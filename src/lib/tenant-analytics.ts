import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  electricityBill,
  landlord,
  paymentAllocation,
  paymentReceipt,
  rentBill,
  tenant,
} from "@/db/schema";

export type TenantAnalytics = {
  tenantId: string;
  rentBilled: number;
  rentPaid: number;
  rentPending: number;
  electricityBilled: number;
  electricityPaid: number;
  electricityPending: number;
  otherPaid: number;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  collectionRate: number;
  paymentCount: number;
  lastPaymentDate: string;
};

export async function getTenantAnalytics(userId: string): Promise<TenantAnalytics[]> {
  const [tenantRows, rentRows, electricityRows, allocationRows, receiptRows] = await Promise.all([
    db
      .select({
        id: tenant.id,
        openingBalance: tenant.openingBalance,
      })
      .from(tenant)
      .innerJoin(landlord, eq(tenant.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({ tenantId: rentBill.tenantId, amount: rentBill.amount })
      .from(rentBill)
      .innerJoin(landlord, eq(rentBill.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({ tenantId: electricityBill.tenantId, amount: electricityBill.amount })
      .from(electricityBill)
      .innerJoin(landlord, eq(electricityBill.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({
        tenantId: paymentReceipt.tenantId,
        chargeType: paymentAllocation.chargeType,
        totalAmount: paymentAllocation.totalAmount,
      })
      .from(paymentAllocation)
      .innerJoin(paymentReceipt, eq(paymentAllocation.paymentReceiptId, paymentReceipt.id))
      .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({
        tenantId: paymentReceipt.tenantId,
        amount: paymentReceipt.amount,
        paidAt: paymentReceipt.paidAt,
      })
      .from(paymentReceipt)
      .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
  ]);

  const analytics = new Map<string, TenantAnalytics>();
  for (const item of tenantRows) {
    analytics.set(item.id, {
      tenantId: item.id,
      rentBilled: Math.max(0, item.openingBalance),
      rentPaid: 0,
      rentPending: 0,
      electricityBilled: 0,
      electricityPaid: 0,
      electricityPending: 0,
      otherPaid: 0,
      totalBilled: 0,
      totalPaid: 0,
      totalPending: 0,
      collectionRate: 0,
      paymentCount: 0,
      lastPaymentDate: "",
    });
  }

  for (const item of rentRows) {
    const value = analytics.get(item.tenantId);
    if (value) value.rentBilled += Number(item.amount);
  }
  for (const item of electricityRows) {
    if (!item.tenantId) continue;
    const value = analytics.get(item.tenantId);
    if (value) value.electricityBilled += Number(item.amount);
  }
  for (const item of allocationRows) {
    const value = analytics.get(item.tenantId);
    if (!value) continue;
    const amount = Number(item.totalAmount);
    if (item.chargeType === "rent") value.rentPaid += amount;
    else if (item.chargeType === "light_bill") value.electricityPaid += amount;
    else value.otherPaid += amount;
  }
  for (const item of receiptRows) {
    const value = analytics.get(item.tenantId);
    if (!value) continue;
    value.totalPaid += Number(item.amount);
    value.paymentCount += 1;
    const paidAt = item.paidAt.toISOString().slice(0, 10);
    if (!value.lastPaymentDate || paidAt > value.lastPaymentDate) value.lastPaymentDate = paidAt;
  }

  return Array.from(analytics.values()).map((value) => {
    const appliedRent = Math.min(value.rentBilled, value.rentPaid);
    const appliedElectricity = Math.min(value.electricityBilled, value.electricityPaid);
    const totalBilled = value.rentBilled + value.electricityBilled;
    const totalPending =
      Math.max(0, value.rentBilled - value.rentPaid) +
      Math.max(0, value.electricityBilled - value.electricityPaid);
    return {
      ...value,
      rentPaid: appliedRent,
      rentPending: Math.max(0, value.rentBilled - value.rentPaid),
      electricityPaid: appliedElectricity,
      electricityPending: Math.max(0, value.electricityBilled - value.electricityPaid),
      totalBilled,
      totalPending,
      collectionRate: totalBilled > 0
        ? Math.round(((appliedRent + appliedElectricity) / totalBilled) * 1000) / 10
        : 0,
    };
  });
}
