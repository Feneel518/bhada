"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { paymentClaim, tenant } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";
import { newPortalToken, portalUrl } from "@/lib/tenant-portal";

type Result = { status: "success" | "error"; message: string; url?: string };

async function owner() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ? ensureLandlord(session.user) : null;
}

export async function rejectPaymentClaim(claimId: string, note: string): Promise<Result> {
  const account = await owner();
  if (!account) return { status: "error", message: "Your session has expired. Please sign in again." };
  const [updated] = await db
    .update(paymentClaim)
    .set({ status: "rejected", reviewNote: note.trim().slice(0, 200) || null, reviewedAt: new Date() })
    .where(and(eq(paymentClaim.id, claimId), eq(paymentClaim.landlordId, account.id), eq(paymentClaim.status, "pending")))
    .returning({ id: paymentClaim.id });
  if (!updated) return { status: "error", message: "This payment was already handled." };
  revalidatePath("/dashboard");
  return { status: "success", message: "Marked as not received. Your tenant will see it on their page." };
}

/** Issues a new private link; the old one stops working immediately. */
export async function resetTenantPortal(tenantId: string): Promise<Result> {
  const account = await owner();
  if (!account) return { status: "error", message: "Your session has expired. Please sign in again." };
  const token = newPortalToken();
  const [updated] = await db
    .update(tenant)
    .set({ portalToken: token, updatedAt: new Date() })
    .where(and(eq(tenant.id, tenantId), eq(tenant.landlordId, account.id)))
    .returning({ id: tenant.id });
  if (!updated) return { status: "error", message: "Tenant not found." };
  revalidatePath("/dashboard");
  return { status: "success", message: "New link created. The old link no longer works.", url: portalUrl(token) };
}
