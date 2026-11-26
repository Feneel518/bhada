// Builds the "who has paid, who hasn't" list for the Overview. Pure and
// client-safe so it can be unit-tested without a database.
import type { ElectricityBillRecord } from "./electricity-billing";
import type { RentBillRecord } from "./rent-billing";
import type { TenantAnalytics } from "./tenant-analytics";
import type { TenantRecord } from "./tenants";

export type CollectionStatus = "overdue" | "due" | "paid";

export type CollectionRow = {
  tenant: TenantRecord;
  status: CollectionStatus;
  outstanding: number;
  /** Earliest unpaid due date (YYYY-MM-DD), if there is a bill. */
  dueDate: string | null;
  daysOverdue: number;
  /** The newest unpaid bill: what the reminder links to. */
  bill: { kind: "rent"; record: RentBillRecord } | { kind: "electricity"; record: ElectricityBillRecord } | null;
};

const DAY = 86_400_000;

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

export function buildCollection({
  tenants,
  rentBills,
  electricityBills,
  analytics,
  today,
}: {
  tenants: TenantRecord[];
  rentBills: RentBillRecord[];
  electricityBills: ElectricityBillRecord[];
  analytics: TenantAnalytics[];
  today: string;
}): CollectionRow[] {
  const order: Record<CollectionStatus, number> = { overdue: 0, due: 1, paid: 2 };
  return tenants
    .filter((tenant) => tenant.isActive)
    .map((tenant): CollectionRow => {
      const unpaid = [
        ...rentBills
          .filter((bill) => bill.tenantId === tenant.id && bill.pending > 0.005)
          .map((record) => ({ kind: "rent" as const, record })),
        ...electricityBills
          .filter((bill) => bill.tenantId === tenant.id && bill.pending > 0.005)
          .map((record) => ({ kind: "electricity" as const, record })),
      ].sort((left, right) => left.record.dueDate.localeCompare(right.record.dueDate));

      const billPending = unpaid.reduce((sum, item) => sum + item.record.pending, 0);
      const fromAnalytics = analytics.find((item) => item.tenantId === tenant.id)?.totalPending;
      const outstanding = Math.max(fromAnalytics ?? 0, billPending);
      const earliest = unpaid[0]?.record.dueDate ?? null;
      const newest = unpaid.at(-1) ?? null;
      const daysOverdue = earliest ? Math.max(0, daysBetween(earliest, today)) : 0;

      let status: CollectionStatus = "paid";
      if (outstanding > 0.005) {
        // A carried-forward opening balance with no bill behind it is already late.
        status = !earliest || daysOverdue > 0 ? "overdue" : "due";
      }

      return { tenant, status, outstanding: status === "paid" ? 0 : outstanding, dueDate: earliest, daysOverdue, bill: newest };
    })
    .sort((left, right) =>
      order[left.status] - order[right.status]
      || right.daysOverdue - left.daysOverdue
      || (left.dueDate ?? "").localeCompare(right.dueDate ?? "")
      || left.tenant.name.localeCompare(right.tenant.name),
    );
}

export function collectionCounts(rows: CollectionRow[]) {
  return rows.reduce(
    (counts, row) => ({ ...counts, [row.status]: counts[row.status] + 1 }),
    { overdue: 0, due: 0, paid: 0 } as Record<CollectionStatus, number>,
  );
}
