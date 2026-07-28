"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord } from "@/db/schema";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
  panError?: string;
};

export async function saveProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { status: "error", message: "Your session has expired. Please sign in again." };
  }

  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const optional = (name: string) => value(name) || null;
  const businessName = value("businessName");
  const pan = value("pan").toUpperCase();

  if (!businessName) {
    return { status: "error", message: "Business name is required." };
  }

  if (pan && !PAN_REGEX.test(pan)) {
    return {
      status: "error",
      message: "Please correct the PAN before saving.",
      panError: "Enter a valid PAN, for example ABCDE1234F.",
    };
  }

  const profile = {
    businessName,
    phone: optional("phone"),
    gstin: value("gstin").toUpperCase() || null,
    pan: pan || null,
    address: optional("address"),
    city: optional("city"),
    state: optional("state"),
    pincode: optional("pincode"),
    updatedAt: new Date(),
  };

  await db
    .insert(landlord)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      ...profile,
    })
    .onConflictDoUpdate({
      target: landlord.userId,
      set: profile,
    });

  revalidatePath("/dashboard/profile");
  return { status: "success", message: "Profile saved." };
}
