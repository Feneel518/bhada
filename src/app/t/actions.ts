"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { meterReadingSubmission, paymentClaim, unit } from "@/db/schema";
import { emailConfigured, sendMeterReadingEmail, sendPaymentClaimEmail } from "@/lib/email";
import { appOrigin } from "@/lib/share-links";
import { CLAIM_METHODS, findTenantByPortalToken, MAX_PENDING_CLAIMS, type ClaimMethod } from "@/lib/tenant-portal";
import { formatCurrency } from "@/lib/utils";

export type ClaimState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"amount" | "paidOn" | "reference", string>>;
};

const methodLabels: Record<ClaimMethod, string> = {
  upi: "UPI",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  check: "Cheque",
};

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitPaymentClaim(_previous: ClaimState, formData: FormData): Promise<ClaimState> {
  const token = text(formData.get("token"), 64);
  const renter = await findTenantByPortalToken(token);
  if (!renter) return { status: "error", message: "This link is no longer active. Ask your landlord for a new one." };
  if (!renter.isActive) return { status: "error", message: "This tenancy has ended, so new payments can't be added here." };

  const amountRaw = text(formData.get("amount"), 20).replace(/[₹,\s]/g, "");
  const amount = Number(amountRaw);
  const paidOnRaw = text(formData.get("paidOn"), 10);
  const methodRaw = text(formData.get("method"), 20);
  const method: ClaimMethod = (CLAIM_METHODS as readonly string[]).includes(methodRaw) ? (methodRaw as ClaimMethod) : "upi";
  const reference = text(formData.get("reference"), 60);
  const note = text(formData.get("note"), 300);

  const errors: ClaimState["errors"] = {};
  if (!/^\d+(\.\d{1,2})?$/.test(amountRaw) || amount <= 0 || amount > 10_000_000) errors.amount = "Enter the amount you paid.";
  const paidOn = /^\d{4}-\d{2}-\d{2}$/.test(paidOnRaw) ? new Date(`${paidOnRaw}T12:00:00+05:30`) : null;
  const tomorrow = Date.now() + 36 * 3_600_000;
  if (!paidOn || Number.isNaN(paidOn.getTime()) || paidOn.getTime() > tomorrow || paidOn.getTime() < Date.now() - 400 * 86_400_000) {
    errors.paidOn = "Choose the date you paid.";
  }
  if ((method === "upi" || method === "bank_transfer") && reference && !/^[\w\s/-]{4,60}$/.test(reference)) {
    errors.reference = "Use letters and numbers only.";
  }
  if (Object.keys(errors).length) return { status: "error", message: "Please check the highlighted fields.", errors };

  const [{ pending }] = await db
    .select({ pending: count() })
    .from(paymentClaim)
    .where(and(eq(paymentClaim.tenantId, renter.id), eq(paymentClaim.status, "pending")));
  if (pending >= MAX_PENDING_CLAIMS) {
    return { status: "error", message: `You already have ${pending} payments waiting for ${renter.businessName} to confirm.` };
  }

  await db.insert(paymentClaim).values({
    id: crypto.randomUUID(),
    landlordId: renter.landlordId,
    tenantId: renter.id,
    amount: amount.toFixed(2),
    paidOn: paidOn!,
    method,
    reference: reference || null,
    note: note || null,
  });

  if (emailConfigured()) {
    // Best effort: the claim is saved either way and shows on the dashboard.
    await sendPaymentClaimEmail({
      to: renter.landlordEmail,
      tenantName: renter.name,
      place: `${renter.propertyName} · Unit ${renter.unitNumber}`,
      amount: formatCurrency(amount),
      details: [
        `Paid on ${paidOnRaw} by ${methodLabels[method]}`,
        reference ? `Ref ${reference}` : "",
        note ? `Note: ${note}` : "",
      ].filter(Boolean).join(" · "),
      dashboardUrl: `${appOrigin()}/dashboard`,
    }).catch((error: unknown) => console.error("Payment claim email failed", error));
  }

  revalidatePath(`/t/${token}`);
  revalidatePath("/dashboard");
  return { status: "success", message: `Sent to ${renter.businessName}. You'll see it here once they confirm.` };
}

export type MeterState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"reading" | "readingDate", string>>;
};

export async function submitMeterReading(_previous: MeterState, formData: FormData): Promise<MeterState> {
  const token = text(formData.get("token"), 64);
  const renter = await findTenantByPortalToken(token);
  if (!renter) return { status: "error", message: "This link is no longer active. Ask your landlord for a new one." };
  if (!renter.isActive) return { status: "error", message: "This tenancy has ended, so readings can't be added here." };

  const readingRaw = text(formData.get("reading"), 20).replace(/[,\s]/g, "");
  const readingDate = text(formData.get("readingDate"), 10);
  const note = text(formData.get("note"), 200);
  const [meter] = await db
    .select({ lastReading: unit.lastMeterReading, lastReadingDate: unit.lastMeterReadingDate })
    .from(unit)
    .where(eq(unit.id, renter.unitId))
    .limit(1);
  if (!meter || meter.lastReading === null || !meter.lastReadingDate) {
    return { status: "error", message: `${renter.businessName} hasn't set up the meter for your unit yet.` };
  }

  const errors: MeterState["errors"] = {};
  const reading = Number(readingRaw);
  if (!/^\d+(\.\d{1,3})?$/.test(readingRaw)) errors.reading = "Enter the number shown on your meter.";
  else if (reading < meter.lastReading) errors.reading = `The last reading was ${meter.lastReading}. Enter a number at least that high.`;
  else if (reading - meter.lastReading > 100_000) errors.reading = "That's far higher than the last reading. Please check it.";
  const lastDate = meter.lastReadingDate.toISOString().slice(0, 10);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(readingDate) || readingDate > today) errors.readingDate = "Choose the date you read the meter.";
  else if (readingDate <= lastDate) errors.readingDate = `Choose a date after the last reading (${lastDate}).`;
  if (Object.keys(errors).length) return { status: "error", message: "Please check the highlighted fields.", errors };

  const [{ pending }] = await db
    .select({ pending: count() })
    .from(meterReadingSubmission)
    .where(and(eq(meterReadingSubmission.unitId, renter.unitId), eq(meterReadingSubmission.status, "pending")));
  if (pending > 0) {
    return { status: "error", message: `Your last reading is still waiting for ${renter.businessName} to approve.` };
  }

  await db.insert(meterReadingSubmission).values({
    id: crypto.randomUUID(),
    landlordId: renter.landlordId,
    unitId: renter.unitId,
    tenantId: renter.id,
    reading: reading.toFixed(3),
    readingDate,
    note: note || null,
  });

  if (emailConfigured()) {
    await sendMeterReadingEmail({
      to: renter.landlordEmail,
      tenantName: renter.name,
      place: `${renter.propertyName} · Unit ${renter.unitNumber}`,
      details: `Reading ${reading} on ${readingDate} (last: ${meter.lastReading} on ${lastDate}, ${(reading - meter.lastReading).toFixed(1)} units)`,
      dashboardUrl: `${appOrigin()}/dashboard`,
    }).catch((error: unknown) => console.error("Meter reading email failed", error));
  }

  revalidatePath(`/t/${token}`);
  revalidatePath("/dashboard");
  return { status: "success", message: `Sent to ${renter.businessName}. Your electricity bill appears here once they approve it.` };
}
