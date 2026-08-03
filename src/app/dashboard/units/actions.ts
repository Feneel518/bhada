"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { property, unit } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";
import { planLimits } from "@/lib/plans";
import type { UnitStatus } from "@/lib/properties";

type UnitField =
  | "unitNumber"
  | "floor"
  | "areaSqft"
  | "status"
  | "openingMeterReading"
  | "openingMeterReadingDate";

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

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() === Number(month) - 1
    && date.getUTCDate() === Number(day);
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
  const openingMeterReading = optionalNumber(value("openingMeterReading"), "Opening meter reading");
  const status = value("status") as UnitStatus;
  const openingMeterDate = value("openingMeterReadingDate");
  const errors: UnitActionState["errors"] = {};

  if (!unitNumber) errors.unitNumber = "Unit number is required.";
  if (area.error) errors.areaSqft = area.error;
  if (openingMeterReading.error) errors.openingMeterReading = openingMeterReading.error;
  if (!statuses.includes(status)) errors.status = "Choose a valid unit status.";
  if (openingMeterDate && !isValidDate(openingMeterDate)) {
    errors.openingMeterReadingDate = "Choose a valid opening reading date.";
  }
  if ((openingMeterReading.value === null) !== !openingMeterDate) {
    if (openingMeterReading.value === null) {
      errors.openingMeterReading = "Enter the opening reading.";
    } else {
      errors.openingMeterReadingDate = "Choose the opening reading date.";
    }
  }

  if (!propertyId) return error("A property is required.");
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please correct the highlighted fields.", errors };
  }

  const owner = await ensureLandlord(session.user);
  const limits = planLimits(owner);
  const [ownedProperty] = await db
    .select({ id: property.id })
    .from(property)
    .where(and(eq(property.id, propertyId), eq(property.landlordId, owner.id)))
    .limit(1);

  if (!ownedProperty) return error("Property not found or you no longer have access to it.");

  if (!id) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(unit)
      .where(eq(unit.landlordId, owner.id));

    if (total >= limits.unitLimit) {
      return error(
        `${limits.name} includes up to ${limits.unitLimit} units.`,
      );
    }
  }

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

  const [existingUnit] = id
    ? await db
        .select({
          openingMeterReading: unit.openingMeterReading,
          openingMeterReadingDate: unit.openingMeterReadingDate,
          lastMeterReading: unit.lastMeterReading,
          lastMeterReadingDate: unit.lastMeterReadingDate,
        })
        .from(unit)
        .where(and(eq(unit.id, id), eq(unit.landlordId, owner.id)))
        .limit(1)
    : [];
  if (id && !existingUnit) return error("Unit not found or you no longer have access to it.");

  const openingDate = openingMeterDate
    ? new Date(`${openingMeterDate}T12:00:00+05:30`)
    : null;
  const lastReadingIsOpening =
    !existingUnit?.lastMeterReadingDate ||
    (existingUnit.openingMeterReading === existingUnit.lastMeterReading &&
      existingUnit.openingMeterReadingDate?.getTime() === existingUnit.lastMeterReadingDate?.getTime());

  const values = {
    propertyId,
    landlordId: owner.id,
    unitNumber,
    floor: floor || null,
    areaSqft: area.value,
    status,
    openingMeterReading: openingMeterReading.value,
    openingMeterReadingDate: openingDate,
    lastMeterReading: !id || lastReadingIsOpening
      ? openingMeterReading.value
      : existingUnit?.lastMeterReading,
    lastMeterReadingDate: !id || lastReadingIsOpening
      ? openingDate
      : existingUnit?.lastMeterReadingDate,
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
