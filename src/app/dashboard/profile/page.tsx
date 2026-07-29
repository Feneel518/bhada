import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
import { getProperties } from "@/lib/properties";
import { getTenants } from "@/lib/tenants";
import { getPayments } from "@/lib/payments";
import { getRentBilling } from "@/lib/rent-billing";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?returnTo=/dashboard/profile");
  }

  const [[profile], properties, tenants, payments, rentBilling] = await Promise.all([
    db
      .select()
      .from(landlord)
      .where(eq(landlord.userId, session.user.id))
      .limit(1),
    getProperties(session.user.id),
    getTenants(session.user.id),
    getPayments(session.user.id),
    getRentBilling(session.user.id),
  ]);

  return (
    <Dashboard
      initialSection="Profile"
      properties={properties}
      tenants={tenants}
      payments={payments}
      rentBilling={rentBilling}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      profile={{
        businessName: profile?.businessName ?? session.user.name,
        phone: profile?.phone ?? "",
        gstin: profile?.gstin ?? "",
        pan: profile?.pan ?? "",
        address: profile?.address ?? "",
        city: profile?.city ?? "",
        state: profile?.state ?? "",
        pincode: profile?.pincode ?? "",
      }}
    />
  );
}
