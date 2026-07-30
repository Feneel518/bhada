import "server-only";

import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  landlord,
  notificationRead,
  paymentReceipt,
  saasBillingEvent,
  tenant,
} from "@/db/schema";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { TenantRecord } from "@/lib/tenants";
import { formatCurrency } from "@/lib/utils";

export type NotificationKind = "payment" | "overdue" | "due_soon" | "lease" | "rent_increase";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  date: string;
  section: "Payments" | "Tenants" | "Profile";
  read: boolean;
};

type NotificationInputs = {
  rentBilling: RentBillingSummary;
  electricityBills: ElectricityBillRecord[];
  tenants: TenantRecord[];
};

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(value: Date) {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function daysFromToday(date: string, today: Date) {
  const value = new Date(`${date}T00:00:00`);
  return Math.round((value.getTime() - today.getTime()) / DAY);
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T12:00:00+05:30`));
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export async function getNotifications(
  userId: string,
  { rentBilling, electricityBills, tenants }: NotificationInputs,
  now = new Date(),
): Promise<NotificationItem[]> {
  const today = startOfDay(now);
  const items: Omit<NotificationItem, "read">[] = [];
  const recentPaymentCutoff = new Date(now.getTime() - 30 * DAY);
  const [recentReceipts, recentSubscriptionPayments] = await Promise.all([
    db
      .select({
        id: paymentReceipt.id,
        receiptNumber: paymentReceipt.receiptNumber,
        amount: paymentReceipt.amount,
        tenantName: tenant.name,
        createdAt: paymentReceipt.createdAt,
      })
      .from(paymentReceipt)
      .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
      .innerJoin(tenant, eq(paymentReceipt.tenantId, tenant.id))
      .where(
        and(
          eq(landlord.userId, userId),
          gte(paymentReceipt.createdAt, recentPaymentCutoff),
        ),
      )
      .orderBy(desc(paymentReceipt.createdAt))
      .limit(30),
    db
      .select({
        id: saasBillingEvent.id,
        amountPaise: saasBillingEvent.amountPaise,
        occurredAt: saasBillingEvent.occurredAt,
      })
      .from(saasBillingEvent)
      .innerJoin(landlord, eq(saasBillingEvent.landlordId, landlord.id))
      .where(
        and(
          eq(landlord.userId, userId),
          eq(saasBillingEvent.eventType, "payment.captured"),
          gte(saasBillingEvent.occurredAt, recentPaymentCutoff),
        ),
      )
      .orderBy(desc(saasBillingEvent.occurredAt))
      .limit(30),
  ]);

  for (const receipt of recentReceipts) {
    items.push({
      id: `payment:${receipt.id}:received`,
      kind: "payment",
      title: "Payment received",
      description: `${formatCurrency(Number(receipt.amount))} received from ${receipt.tenantName} · ${receipt.receiptNumber}.`,
      date: dateKey(receipt.createdAt),
      section: "Payments",
    });
  }

  for (const payment of recentSubscriptionPayments) {
    items.push({
      id: `subscription-payment:${payment.id}:captured`,
      kind: "payment",
      title: "Subscription payment successful",
      description: `${formatCurrency(payment.amountPaise / 100)} Razorpay payment captured for your Portfolio plan.`,
      date: dateKey(payment.occurredAt),
      section: "Profile",
    });
  }

  for (const bill of rentBilling.bills) {
    if (bill.status === "Paid") continue;
    const days = daysFromToday(bill.dueDate, today);
    if (days > 7) continue;
    const overdue = days < 0;
    items.push({
      id: `rent:${bill.id}:${overdue ? "overdue" : "due"}`,
      kind: overdue ? "overdue" : "due_soon",
      title: overdue ? "Rent payment overdue" : "Rent payment due soon",
      description: `${bill.tenantName} has ${formatCurrency(bill.pending)} ${overdue ? "overdue" : "due"} on ${dateLabel(bill.dueDate)}.`,
      date: bill.dueDate,
      section: "Payments",
    });
  }

  for (const bill of electricityBills) {
    if (bill.status === "Paid") continue;
    const days = daysFromToday(bill.dueDate, today);
    if (days > 7) continue;
    const overdue = days < 0;
    items.push({
      id: `electricity:${bill.id}:${overdue ? "overdue" : "due"}`,
      kind: overdue ? "overdue" : "due_soon",
      title: overdue ? "Electricity bill overdue" : "Electricity bill due soon",
      description: `${bill.tenantName} · ${bill.propertyName} ${bill.unitNumber}: ${formatCurrency(bill.pending)} ${overdue ? "was due" : "is due"} on ${dateLabel(bill.dueDate)}.`,
      date: bill.dueDate,
      section: "Payments",
    });
  }

  for (const renter of tenants) {
    if (!renter.isActive) continue;

    if (renter.leaseEnd) {
      const days = daysFromToday(renter.leaseEnd, today);
      if (days >= 0 && days <= 30) {
        items.push({
          id: `tenant:${renter.id}:lease:${renter.leaseEnd}`,
          kind: "lease",
          title: days === 0 ? "Lease ends today" : "Lease ending soon",
          description: `${renter.name}'s lease for ${renter.propertyName} ${renter.unitNumber} ends on ${dateLabel(renter.leaseEnd)}.`,
          date: renter.leaseEnd,
          section: "Tenants",
        });
      }
    }

    if (renter.nextEscalationDate && renter.rentEscalationPct) {
      const days = daysFromToday(renter.nextEscalationDate, today);
      if (days >= 0 && days <= 30) {
        items.push({
          id: `tenant:${renter.id}:increase:${renter.nextEscalationDate}`,
          kind: "rent_increase",
          title: days === 0 ? "Rent increase due today" : "Rent increase scheduled",
          description: `${renter.name}'s rent increases by ${renter.rentEscalationPct}% on ${dateLabel(renter.nextEscalationDate)}.`,
          date: renter.nextEscalationDate,
          section: "Tenants",
        });
      }
    }
  }

  const priority: Record<NotificationKind, number> = {
    payment: 0,
    overdue: 1,
    due_soon: 2,
    lease: 3,
    rent_increase: 4,
  };
  const visible = items
    .sort((a, b) => {
      const kindDifference = priority[a.kind] - priority[b.kind];
      if (kindDifference) return kindDifference;
      return a.kind === "payment"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
    })
    .slice(0, 30);

  if (!visible.length) return [];

  const readRows = await db
    .select({ key: notificationRead.notificationKey })
    .from(notificationRead)
    .innerJoin(landlord, eq(notificationRead.landlordId, landlord.id))
    .where(
      and(
        eq(landlord.userId, userId),
        inArray(notificationRead.notificationKey, visible.map((item) => item.id)),
      ),
    );
  const readKeys = new Set(readRows.map((row) => row.key));

  return visible.map((item) => ({ ...item, read: readKeys.has(item.id) }));
}
