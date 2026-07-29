import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
import { getProperties } from "@/lib/properties";
import { getTenants } from "@/lib/tenants";
import { getPayments } from "@/lib/payments";
import { getRentBilling } from "@/lib/rent-billing";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?returnTo=/dashboard");
  }

  const rentBilling = await getRentBilling(session.user.id);
  const [properties, tenants, payments] = await Promise.all([
    getProperties(session.user.id),
    getTenants(session.user.id),
    getPayments(session.user.id),
  ]);

  return (
    <Dashboard
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
    />
  );
}
