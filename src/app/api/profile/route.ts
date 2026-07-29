import { headers } from "next/headers";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import { auth } from "@/lib/auth";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json(
      { status: "error", message: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const optional = (name: string) => value(name) || null;
  const businessName = value("businessName");
  const rentBillingPeriod = value("rentBillingPeriod");
  const pan = value("pan").toUpperCase();

  if (!businessName) {
    return Response.json(
      { status: "error", message: "Business name is required." },
      { status: 400 },
    );
  }

  if (pan && !PAN_REGEX.test(pan)) {
    return Response.json(
      {
        status: "error",
        message: "Please correct the PAN before saving.",
        panError: "Enter a valid PAN, for example ABCDE1234F.",
      },
      { status: 400 },
    );
  }

  if (!["previous", "current"].includes(rentBillingPeriod)) {
    return Response.json(
      { status: "error", message: "Choose a valid monthly rent billing period." },
      { status: 400 },
    );
  }

  const profile = {
    businessName,
    rentBillingPeriod,
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

  return Response.json({ status: "success", message: "Profile saved." });
}
