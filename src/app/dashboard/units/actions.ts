"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { property, unit } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";
import type { UnitStatus } from "@/lib/properties";

type UnitField =
  | "unitNumber"
  | "floor"
  | "areaSqft"
  | "status"
  | "lastMeterReading"
  | "lastMeterReadingDate";

export type UnitActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<UnitField, string>>;
};

const statuses: UnitStatus[] = ["vacant", "occupied", "maintenance"];

function error(message: string): UnitActionState {
  return { status: "error", message };
}

function refreshUnitViews() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
}

function optionalNumber(raw: string, label: string) {
  if (!raw) return { value: null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return { value: null, error: `${label} must be zero or greater.` };
  }
  return { value };
}

export async function saveUnit(
  _previousState: UnitActionState,
  formData: FormData,
): Promise<UnitActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return error("Your session has expired. Please sign in again.");

  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const id = value("id");
  const propertyId = value("propertyId");
  const unitNumber = value("unitNumber");
  const floor = value("floor");
  const area = optionalNumber(value("areaSqft"), "Area");
  const meterReading = optionalNumber(value("lastMeterReading"), "Meter reading");
  const status = value("status") as UnitStatus;
  const meterDateRaw = value("lastMeterReadingDate");
  const errors: UnitActionState["errors"] = {};

  if (!unitNumber) errors.unitNumber = "Unit number is required.";
  if (area.error) errors.areaSqft = area.error;
  if (meterReading.error) errors.lastMeterReading = meterReading.error;
  if (!statuses.includes(status)) errors.status = "Choose a valid unit status.";
  if (meterDateRaw && Number.isNaN(new Date(`${meterDateRaw}T00:00:00`).getTime())) {
    errors.lastMeterReadingDate = "Choose a valid reading date.";
  }

  if (!propertyId) return error("A property is required.");
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please correct the highlighted fields.", errors };
  }

  const owner = await ensureLandlord(session.user);
  const [ownedProperty] = await db
    .select({ id: property.id })
    .from(property)
    .where(and(eq(property.id, propertyId), eq(property.landlordId, owner.id)))
    .limit(1);

  if (!ownedProperty) return error("Property not found or you no longer have access to it.");

  const duplicateConditions = [
    eq(unit.propertyId, propertyId),
    eq(unit.unitNumber, unitNumber),
  ];
  if (id) duplicateConditions.push(ne(unit.id, id));

  const [duplicate] = await db
    .select({ id: unit.id })
    .from(unit)
    .where(and(...duplicateConditions))
    .limit(1);

  if (duplicate) {
    return {
      status: "error",
      message: "Unit numbers must be unique within a property.",
      errors: { unitNumber: "This unit number already exists in this property." },
    };
  }

  const values = {
    propertyId,
    landlordId: owner.id,
    unitNumber,
    floor: floor || null,
    areaSqft: area.value,
    status,
    lastMeterReading: meterReading.value,
    lastMeterReadingDate: meterDateRaw ? new Date(`${meterDateRaw}T00:00:00`) : null,
    updatedAt: new Date(),
  };

  if (id) {
    const [updated] = await db
      .update(unit)
      .set(values)
      .where(and(eq(unit.id, id), eq(unit.landlordId, owner.id)))
      .returning({ id: unit.id });

    if (!updated) return error("Unit not found or you no longer have access to it.");
  } else {
    await db.insert(unit).values({ id: crypto.randomUUID(), ...values });
  }

  refreshUnitViews();
  return { status: "success", message: id ? "Unit updated." : "Unit added." };
}

export async function deleteUnit(id: string): Promise<UnitActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return error("Your session has expired. Please sign in again.");

  const owner = await ensureLandlord(session.user);
  const [deleted] = await db
    .delete(unit)
    .where(and(eq(unit.id, id), eq(unit.landlordId, owner.id)))
    .returning({ id: unit.id });

  if (!deleted) return error("Unit not found or you no longer have access to it.");

  refreshUnitViews();
  return { status: "success", message: "Unit deleted." };
}
