"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { paymentAllocation, paymentReceipt, tenant } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";

type PaymentField = "tenantId" | "paidAt" | "allocations";

export type PaymentActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<PaymentField, string>>;
};

type RawAllocation = {
  chargeType?: unknown;
  description?: unknown;
  billReference?: unknown;
  amount?: unknown;
  gstRate?: unknown;
};

const fail = (message: string, errors?: PaymentActionState["errors"]): PaymentActionState => ({
  status: "error",
  message,
  errors,
});

function text(value: unknown, maxLength = 250) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function moneyToPaise(value: unknown) {
  const raw = text(value, 30);
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  const [rupees, paise = ""] = raw.split(".");
  const amount = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function asMoney(paise: number) {
  return (paise / 100).toFixed(2);
}

export async function recordPayment(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Your session has expired. Please sign in again.");

  const tenantId = text(formData.get("tenantId"), 100);
  const allocationMode = formData.get("allocationMode") === "bill_wise" ? "bill_wise" : "lump_sum";
  const paidAtInput = text(formData.get("paidAt"), 10);
  const paidAt = /^\d{4}-\d{2}-\d{2}$/.test(paidAtInput)
    ? new Date(`${paidAtInput}T12:00:00`)
    : null;
  const methodInput = text(formData.get("method"), 30);
  const method = ["bank_transfer", "cash", "check", "card"].includes(methodInput)
    ? (methodInput as "bank_transfer" | "cash" | "check" | "card")
    : "bank_transfer";

  const errors: PaymentActionState["errors"] = {};
  if (!tenantId) errors.tenantId = "Choose a tenant.";
  if (!paidAt || Number.isNaN(paidAt.getTime())) errors.paidAt = "Choose a valid payment date.";

  let rawAllocations: RawAllocation[] = [];
  try {
    const parsed: unknown = JSON.parse(text(formData.get("allocations"), 50_000));
    if (Array.isArray(parsed)) rawAllocations = parsed;
  } catch {
    // The field-level error below gives the user a useful recovery path.
  }

  if (!rawAllocations.length || rawAllocations.length > 50) {
    errors.allocations = "Add at least one valid payment amount.";
  }

  const allocations = rawAllocations.flatMap((raw) => {
    const amountPaise = moneyToPaise(raw.amount);
    const chargeType = ["rent", "light_bill", "other"].includes(text(raw.chargeType))
      ? (text(raw.chargeType) as "rent" | "light_bill" | "other")
      : null;
    const gstRate = Number(text(raw.gstRate, 10) || "0");
    if (
      amountPaise === null ||
      !chargeType ||
      !Number.isFinite(gstRate) ||
      gstRate < 0 ||
      gstRate > 100
    ) {
      return [];
    }
    const gstPaise = Math.round((amountPaise * gstRate) / 100);
    return [{
      chargeType,
      description: text(raw.description) || null,
      billReference: text(raw.billReference, 100) || null,
      amountBeforeGst: asMoney(amountPaise),
      gstRate: gstRate.toFixed(2),
      gstAmount: asMoney(gstPaise),
      totalAmount: asMoney(amountPaise + gstPaise),
      totalPaise: amountPaise + gstPaise,
    }];
  });

  if (allocations.length !== rawAllocations.length) {
    errors.allocations = "Every line needs a valid positive amount and GST rate.";
  }
  if (allocationMode === "lump_sum" && allocations.length !== 1) {
    errors.allocations = "A lump-sum payment must contain one amount.";
  }
  if (Object.keys(errors).length) return fail("Please correct the highlighted fields.", errors);

  const owner = await ensureLandlord(session.user);
  const [ownedTenant] = await db
    .select({ id: tenant.id })
    .from(tenant)
    .where(and(eq(tenant.id, tenantId), eq(tenant.landlordId, owner.id)))
    .limit(1);
  if (!ownedTenant) return fail("Tenant not found or you no longer have access to it.", {
    tenantId: "Choose one of your tenants.",
  });

  const receiptId = crypto.randomUUID();
  const receiptNumber = `RCPT-${paidAtInput.replaceAll("-", "")}-${receiptId.slice(0, 6).toUpperCase()}`;
  const totalPaise = allocations.reduce((sum, allocation) => sum + allocation.totalPaise, 0);
  const allocationRows = allocations.map((allocation) => ({
    id: crypto.randomUUID(),
    paymentReceiptId: receiptId,
    chargeType: allocation.chargeType,
    description: allocation.description,
    billReference: allocation.billReference,
    amountBeforeGst: allocation.amountBeforeGst,
    gstRate: allocation.gstRate,
    gstAmount: allocation.gstAmount,
    totalAmount: allocation.totalAmount,
  }));

  await db.batch([
    db.insert(paymentReceipt).values({
      id: receiptId,
      landlordId: owner.id,
      tenantId,
      receiptNumber,
      allocationMode,
      amount: asMoney(totalPaise),
      paidAt: paidAt!,
      method,
      reference: text(formData.get("reference"), 100) || null,
      note: text(formData.get("note"), 1_000) || null,
    }),
    db.insert(paymentAllocation).values(allocationRows),
  ]);

  revalidatePath("/dashboard");
  return { status: "success", message: `Payment recorded as ${receiptNumber}.` };
}
