import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { landlord, notificationRead } from "@/db/schema";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { TenantRecord } from "@/lib/tenants";
import { formatCurrency } from "@/lib/utils";

export type NotificationKind = "overdue" | "due_soon" | "lease" | "rent_increase";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  date: string;
  section: "Payments" | "Tenants";
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

export async function getNotifications(
  userId: string,
  { rentBilling, electricityBills, tenants }: NotificationInputs,
  now = new Date(),
): Promise<NotificationItem[]> {
  const today = startOfDay(now);
  const items: Omit<NotificationItem, "read">[] = [];

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
    overdue: 0,
    due_soon: 1,
    lease: 2,
    rent_increase: 3,
  };
  const visible = items
    .sort((a, b) => priority[a.kind] - priority[b.kind] || a.date.localeCompare(b.date))
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
