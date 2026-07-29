"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { electricityBill, tenant, unit } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";

type ElectricityBillField = "unitId" | "billingPeriod" | "amount" | "dueDate";

export type ElectricityBillActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<ElectricityBillField, string>>;
};

const fail = (
  message: string,
  errors?: ElectricityBillActionState["errors"],
): ElectricityBillActionState => ({ status: "error", message, errors });

export async function createElectricityBill(
  _previousState: ElectricityBillActionState,
  formData: FormData,
): Promise<ElectricityBillActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Your session has expired. Please sign in again.");

  const text = (name: string, maxLength = 250) =>
    String(formData.get(name) ?? "").trim().slice(0, maxLength);
  const unitId = text("unitId", 100);
  const billingPeriod = text("billingPeriod", 7);
  const amountInput = text("amount", 30);
  const dueDateInput = text("dueDate", 10);
  const errors: ElectricityBillActionState["errors"] = {};

  if (!unitId) errors.unitId = "Choose a unit.";
  if (!/^\d{4}-\d{2}$/.test(billingPeriod)) {
    errors.billingPeriod = "Choose a billing month.";
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(amountInput) || Number(amountInput) <= 0) {
    errors.amount = "Enter a positive amount with up to 2 decimal places.";
  }
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDateInput)
    ? new Date(`${dueDateInput}T00:00:00+05:30`)
    : null;
  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    errors.dueDate = "Choose a valid due date.";
  }
  if (Object.keys(errors).length) {
    return fail("Please correct the highlighted fields.", errors);
  }

  const owner = await ensureLandlord(session.user);
  const [ownedUnit] = await db
    .select({
      id: unit.id,
      activeTenantId: tenant.id,
    })
    .from(unit)
    .leftJoin(
      tenant,
      and(
        eq(tenant.unitId, unit.id),
        eq(tenant.landlordId, owner.id),
        eq(tenant.isActive, true),
      ),
    )
    .where(and(eq(unit.id, unitId), eq(unit.landlordId, owner.id)))
    .limit(1);

  if (!ownedUnit) {
    return fail("Unit not found or you no longer have access to it.", {
      unitId: "Choose one of your units.",
    });
  }

  const id = crypto.randomUUID();
  const billNumber = `ELEC-${billingPeriod.replace("-", "")}-${id.slice(0, 6).toUpperCase()}`;
  await db.insert(electricityBill).values({
    id,
    landlordId: owner.id,
    unitId,
    tenantId: ownedUnit.activeTenantId,
    billNumber,
    billingPeriod,
    amount: Number(amountInput).toFixed(2),
    dueDate: dueDate!,
    note: text("note", 1_000) || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { status: "success", message: `Electricity bill ${billNumber} added.` };
}
