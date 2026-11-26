"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { meterReadingSubmission, property, unit } from "@/db/schema";
import { auth } from "@/lib/auth";
import { insertElectricityBill, parseIndiaDate, type ElectricityBillField } from "@/lib/electricity-bill-write";
import { ensureLandlord } from "@/lib/landlords";
import { shareUrl } from "@/lib/share-links";

export type ElectricityBillActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<ElectricityBillField, string>>;
  /** Lets the dialog offer "Send to tenant" right after the bill is created. */
  bill?: { id: string; billNumber: string; tenantId: string | null; amount: number; shareUrl: string };
};

const fail = (
  message: string,
  errors?: ElectricityBillActionState["errors"],
): ElectricityBillActionState => ({ status: "error", message, errors });

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
}

export async function createElectricityBill(
  _previousState: ElectricityBillActionState,
  formData: FormData,
): Promise<ElectricityBillActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Your session has expired. Please sign in again.");

  const text = (name: string, maxLength = 250) =>
    String(formData.get(name) ?? "").trim().slice(0, maxLength);
  const unitId = text("unitId", 100);
  const billingPeriod = text("billingPeriod", 10);
  const currentReadingInput = text("currentReading", 30);
  const unitRateInput = text("unitRate", 30);
  const dueDateInput = text("dueDate", 10);
  const submissionId = text("submissionId", 100) || undefined;
  const errors: ElectricityBillActionState["errors"] = {};

  if (!unitId) errors.unitId = "Choose a unit.";
  if (!parseIndiaDate(billingPeriod)) errors.billingPeriod = "Choose a valid meter reading date.";
  if (!/^\d+(?:\.\d{1,3})?$/.test(currentReadingInput)) {
    errors.currentReading = "Enter a valid meter reading with up to 3 decimal places.";
  }
  if (!/^\d+(?:\.\d{1,4})?$/.test(unitRateInput) || Number(unitRateInput) <= 0) {
    errors.unitRate = "Enter a positive rate with up to 4 decimal places.";
  }
  const dueDate = parseIndiaDate(dueDateInput, 0);
  if (!dueDate) errors.dueDate = "Choose a valid due date.";
  if (Object.keys(errors).length) return fail("Please correct the highlighted fields.", errors);

  const owner = await ensureLandlord(session.user);
  if (submissionId) {
    const [submission] = await db
      .select({ status: meterReadingSubmission.status, unitId: meterReadingSubmission.unitId })
      .from(meterReadingSubmission)
      .where(and(eq(meterReadingSubmission.id, submissionId), eq(meterReadingSubmission.landlordId, owner.id)))
      .limit(1);
    if (!submission || submission.status !== "pending") return fail("This reading was already approved or rejected.");
    if (submission.unitId !== unitId) return fail("Keep the unit the tenant sent the reading for.", { unitId: "Keep the tenant's unit." });
  }

  const result = await insertElectricityBill(owner, {
    unitId,
    billingPeriod,
    currentReading: Number(currentReadingInput),
    unitRate: Number(unitRateInput),
    dueDate: dueDate!,
    note: text("note", 1_000) || null,
    submissionId,
  });
  if (!result.ok) return fail(result.message, result.errors);

  refresh();
  return {
    status: "success",
    message: `Electricity bill ${result.billNumber} added.`,
    bill: { ...result, shareUrl: await shareUrl("electricity", result.id) },
  };
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00+05:30`);
  value.setUTCDate(value.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(value);
}

/** One-tap approval of a tenant's reading, using the property's rate. Due in 7 days. */
export async function approveMeterReading(submissionId: string): Promise<ElectricityBillActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Your session has expired. Please sign in again.");
  const owner = await ensureLandlord(session.user);

  const [submission] = await db
    .select({
      status: meterReadingSubmission.status,
      unitId: meterReadingSubmission.unitId,
      reading: meterReadingSubmission.reading,
      readingDate: meterReadingSubmission.readingDate,
      note: meterReadingSubmission.note,
      rate: property.electricityRate,
      propertyName: property.name,
    })
    .from(meterReadingSubmission)
    .innerJoin(unit, eq(meterReadingSubmission.unitId, unit.id))
    .innerJoin(property, eq(unit.propertyId, property.id))
    .where(and(eq(meterReadingSubmission.id, submissionId), eq(meterReadingSubmission.landlordId, owner.id)))
    .limit(1);
  if (!submission || submission.status !== "pending") return fail("This reading was already approved or rejected.");
  if (!submission.rate || submission.rate <= 0) {
    return fail(`Set an electricity rate for ${submission.propertyName} first, or use Edit to enter one for this bill.`);
  }

  const dueDate = parseIndiaDate(addDays(submission.readingDate, 7), 0)!;
  const result = await insertElectricityBill(owner, {
    unitId: submission.unitId,
    billingPeriod: submission.readingDate,
    currentReading: Number(submission.reading),
    unitRate: submission.rate,
    dueDate,
    note: submission.note ? `Reading sent by tenant: ${submission.note}` : "Reading sent by tenant",
    submissionId,
  });
  if (!result.ok) return fail(`${result.message} Use Edit to correct it.`);

  refresh();
  return {
    status: "success",
    message: `Electricity bill ${result.billNumber} created.`,
    bill: { ...result, shareUrl: await shareUrl("electricity", result.id) },
  };
}

export async function rejectMeterReading(submissionId: string, note: string): Promise<ElectricityBillActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Your session has expired. Please sign in again.");
  const owner = await ensureLandlord(session.user);
  const [updated] = await db
    .update(meterReadingSubmission)
    .set({ status: "rejected", reviewNote: note.trim().slice(0, 200) || null, reviewedAt: new Date() })
    .where(and(
      eq(meterReadingSubmission.id, submissionId),
      eq(meterReadingSubmission.landlordId, owner.id),
      eq(meterReadingSubmission.status, "pending"),
    ))
    .returning({ id: meterReadingSubmission.id });
  if (!updated) return fail("This reading was already approved or rejected.");
  refresh();
  return { status: "success", message: "Reading sent back. Your tenant can enter it again." };
}
