"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { property } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";

export type PropertyActionState = {
  status: "idle" | "success" | "error";
  message: string;
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

  if (id) {
    const [updated] = await db
      .update(property)
      .set(values)
      .where(and(eq(property.id, id), eq(property.landlordId, owner.id)))
      .returning({ id: property.id });

    if (!updated) {
      return initialError("Property not found or you no longer have access to it.");
    }
  } else {
    await db.insert(property).values({
      id: crypto.randomUUID(),
      landlordId: owner.id,
      ...values,
    });
  }

  refreshPropertyViews();
  return {
    status: "success",
    message: id ? "Property updated." : "Property added.",
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
