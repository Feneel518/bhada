import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
import { getProperties } from "@/lib/properties";
import { getTenants } from "@/lib/tenants";
import { getPayments } from "@/lib/payments";
import { getRentBilling } from "@/lib/rent-billing";
import { getElectricityBills } from "@/lib/electricity-billing";
import { resolveFinancialYearStart } from "@/lib/financial-year";
import { getAvailableFinancialYears } from "@/lib/financial-year-server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string; section?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?returnTo=/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const financialYearStart = resolveFinancialYearStart(params.fy, now);
  const [properties, tenants, payments, rentBilling, electricityBills, financialYearOptions] = await Promise.all([
    getProperties(session.user.id),
    getTenants(session.user.id),
    getPayments(session.user.id),
    getRentBilling(session.user.id, now, financialYearStart),
    getElectricityBills(session.user.id, now, financialYearStart),
    getAvailableFinancialYears(session.user.id, financialYearStart, now),
  ]);

  return (
    <Dashboard
      initialSection={params.section === "Payments" ? "Payments" : "Overview"}
      properties={properties}
      tenants={tenants}
      payments={payments}
      rentBilling={rentBilling}
      electricityBills={electricityBills}
      financialYearStart={financialYearStart}
      financialYearOptions={financialYearOptions}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
