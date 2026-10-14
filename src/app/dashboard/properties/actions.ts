"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { landlord, property } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";
import { planLimits } from "@/lib/plans";
import { getRentalAccess, RENTAL_LOCK_MESSAGE } from "@/lib/plan-access";

export type PropertyActionState = {
  status: "idle" | "success" | "error";
  message: string;
  id?: string;
  errors?: Partial<Record<"name" | "address" | "city" | "state" | "postalCode", string>>;
};

const initialError = (message: string): PropertyActionState => ({
  status: "error",
  message,
});

function refreshPropertyViews() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
}

export async function saveProperty(
  _previousState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return initialError("Your session has expired. Please sign in again.");
  }

  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const id = value("id");
  const name = value("name");
  const address = value("address");
  const city = value("city");
  const state = value("state");
  const postalCode = value("postalCode");
  const errors: PropertyActionState["errors"] = {};

  if (!name) errors.name = "Property name is required.";
  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please complete the required fields.",
      errors,
    };
  }

  const values = {
    name,
    address: address || null,
    city: city || null,
    state: state || null,
    postalCode: postalCode || null,
    updatedAt: new Date(),
  };
  const owner = await ensureLandlord(session.user);
  const limits = planLimits(owner);
  const savedId = id || crypto.randomUUID();

  if (id) {
    if (!(await getRentalAccess(owner)).propertyIds.includes(id)) return initialError(RENTAL_LOCK_MESSAGE);
    const [updated] = await db
      .update(property)
      .set(values)
      .where(and(eq(property.id, id), eq(property.landlordId, owner.id)))
      .returning({ id: property.id });

    if (!updated) {
      return initialError("Property not found or you no longer have access to it.");
    }
  } else {
    const [{ total }] = await db
      .select({ total: count() })
      .from(property)
      .where(eq(property.landlordId, owner.id));

    if (total >= limits.propertyLimit) {
      return initialError(
        `${limits.name} includes ${limits.propertyLimit} ${limits.propertyLimit === 1 ? "property" : "properties"}.`,
      );
    }

    // Lock per account and count inside the insert transaction so two tabs
    // cannot both claim the final slot.
    const [, inserted] = await db.batch([
      db.execute(sql`select id from landlord where id = ${owner.id} for update`),
      db.insert(property).select(db.select({
        id: sql<string>`${savedId}`.as("id"), landlordId: landlord.id,
        name: sql<string>`${values.name}`.as("name"), address: sql<string>`${values.address}`.as("address"),
        city: sql<string>`${values.city}`.as("city"), state: sql<string>`${values.state}`.as("state"),
        postalCode: sql<string>`${values.postalCode}`.as("postalCode"), createdAt: sql<Date>`now()`.as("createdAt"), updatedAt: sql<Date>`now()`.as("updatedAt"),
      }).from(landlord).where(and(eq(landlord.id, owner.id),
        sql`(select count(*) from property where landlord_id = ${owner.id}) < ${limits.propertyLimit}`)))
        .returning({ id: property.id }),
    ]);
    if (!inserted.length) return initialError(`${limits.name} property limit reached. Refresh to see your properties.`);
  }

  refreshPropertyViews();
  return {
    status: "success",
    message: id ? "Property updated." : "Property added.",
    id: savedId,
  };
}

export async function deleteProperty(id: string): Promise<PropertyActionState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return initialError("Your session has expired. Please sign in again.");
  }

  const owner = await ensureLandlord(session.user);
  const [deleted] = await db
    .delete(property)
    .where(and(eq(property.id, id), eq(property.landlordId, owner.id)))
    .returning({ id: property.id });

  if (!deleted) {
    return initialError("Property not found or you no longer have access to it.");
  }

  refreshPropertyViews();
  return { status: "success", message: "Property deleted." };
}
