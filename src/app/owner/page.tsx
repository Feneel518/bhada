import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  DoorOpen,
  IndianRupee,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { BhadaLogo } from "@/components/brand-logo";
import { getOwnerAnalytics } from "@/lib/owner-analytics";
import { requireOwner } from "@/lib/owner";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Owner analytics",
  description: "Private business analytics for Bhada.",
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

function formatPercent(value: number) {
  return `${number.format(value)}%`;
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "violet",
}: {
  label: string;
  value: string;
  note: React.ReactNode;
  icon: typeof IndianRupee;
  tone?: "violet" | "green" | "amber" | "red";
}) {
  const tones = {
    violet: "bg-[#6f6ad8]/10 text-[#625cc8]",
    green: "bg-[#168b72]/10 text-[#168b72]",
    amber: "bg-[#c79729]/10 text-[#a6780e]",
    red: "bg-[#c65c4d]/10 text-[#c65c4d]",
  };

  return (
    <article className="rounded-2xl border border-[#e7e8ef] bg-white p-5 shadow-[0_10px_30px_rgba(30,36,50,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#878d9c]">{label}</p>
          <p className="mt-3 text-[28px] font-semibold tracking-[-0.035em] text-[#202534]">{value}</p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-[19px]" strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 text-xs leading-5 text-[#7c8291]">{note}</div>
    </article>
  );
}

function MiniStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="border-b border-[#ececf2] py-4 last:border-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-[#666d7d]">{label}</span>
        <span className="text-lg font-semibold tracking-[-0.02em] text-[#242938]">{value}</span>
      </div>
      <p className="mt-1 text-[11px] text-[#9a9fac]">{helper}</p>
    </div>
  );
}

function Trend({
  value,
  suffix = "vs last month",
}: {
  value: number;
  suffix?: string;
}) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", positive ? "text-[#168b72]" : "text-[#c65c4d]")}>
      <Icon className="size-3.5" />
      {number.format(Math.abs(value))}% {suffix}
    </span>
  );
}

function BarChart({
  data,
  valueKey,
  formatValue,
  emptyMessage,
}: {
  data: Awaited<ReturnType<typeof getOwnerAnalytics>>["monthly"];
  valueKey: "revenue" | "signups";
  formatValue: (value: number) => string;
  emptyMessage: string;
}) {
  const max = Math.max(...data.map((item) => item[valueKey]), 0);

  return (
    <div>
      <div className="relative mt-7 flex h-52 items-end gap-2 border-b border-[#dedfe7] sm:gap-3">
        {[25, 50, 75, 100].map((line) => (
          <span
            key={line}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#ececf2]"
            style={{ bottom: `${line}%` }}
          />
        ))}
        {data.map((item) => {
          const value = item[valueKey];
          const height = max ? Math.max(value ? 8 : 2, (value / max) * 100) : 2;
          return (
            <div key={item.key} className="group relative z-10 flex h-full min-w-0 flex-1 items-end">
              <div
                className={cn(
                  "w-full rounded-t-md transition-colors",
                  value ? "bg-[#6f6ad8]/75 group-hover:bg-[#5b56c7]" : "bg-[#e9e9f1]",
                )}
                style={{ height: `${height}%` }}
              />
              <span
                className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#252938] px-2 py-1 text-[10px] font-semibold text-white group-hover:block"
                style={{ bottom: `calc(${height}% + 8px)` }}
              >
                {formatValue(value)}
              </span>
            </div>
          );
        })}
        {max === 0 && (
          <p className="absolute inset-0 grid place-items-center text-sm text-[#969ba8]">{emptyMessage}</p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-12 gap-2 sm:gap-3">
        {data.map((item) => (
          <span key={item.key} className="truncate text-center text-[10px] font-medium text-[#8c919e]">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function OwnerPage() {
  const owner = await requireOwner();
  const analytics = await getOwnerAnalytics();
  const lastUpdated = analytics.generatedAt.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#202534]">
      <header className="sticky top-0 z-30 border-b border-[#e5e6ec]/90 bg-[#f7f8fc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center gap-4 px-4 sm:px-7 lg:px-10">
          <BhadaLogo markClassName="size-9 text-[#292d3b]" wordmarkClassName="text-[18px] text-[#292d3b]" />
          <span className="hidden h-6 w-px bg-[#dfe1e8] sm:block" />
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-[#303646]">Owner console</p>
            <p className="text-[10px] text-[#979ca9]">Private business intelligence</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#dfe1e8] bg-white px-3 py-1.5 text-[11px] font-medium text-[#737987] md:flex">
              <ShieldCheck className="size-3.5 text-[#168b72]" /> {owner.email}
            </span>
            <Link
              href="/owner"
              className="grid size-9 place-items-center rounded-lg border border-[#dfe1e8] bg-white text-[#6f7482] transition hover:border-[#c9c8eb] hover:text-[#5b56c7]"
              aria-label="Refresh analytics"
              title="Refresh analytics"
            >
              <RefreshCw className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#252938] px-3 text-xs font-semibold text-white transition hover:bg-[#34394b]"
            >
              <LayoutDashboard className="size-4" /> <span className="hidden sm:inline">App dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6f6ad8]">
              <Activity className="size-4" /> LIVE BUSINESS OVERVIEW
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-[-0.035em] text-[#202534] sm:text-4xl">
              SaaS command center
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#777d8c]">
              Revenue, growth, retention, and product adoption across Bhada.
            </p>
          </div>
          <p className="text-[11px] text-[#999eaa]">Updated {lastUpdated}</p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Monthly recurring revenue"
            value={money.format(analytics.revenue.mrr)}
            icon={IndianRupee}
            tone="green"
            note={`${analytics.revenue.payingCustomers} paying ${analytics.revenue.payingCustomers === 1 ? "customer" : "customers"} · ${money.format(analytics.revenue.arr)} ARR`}
          />
          <MetricCard
            label="Total users"
            value={number.format(analytics.growth.totalUsers)}
            icon={Users}
            note={<><Trend value={analytics.growth.signupGrowth} /> · {analytics.growth.newThisMonth} this month</>}
          />
          <MetricCard
            label="New joiners · 30 days"
            value={number.format(analytics.growth.newLast30Days)}
            icon={UserPlus}
            tone="amber"
            note={`${analytics.growth.netAddsLast30Days >= 0 ? "+" : ""}${analytics.growth.netAddsLast30Days} net adds after churn`}
          />
          <MetricCard
            label="Customers left · 30 days"
            value={number.format(analytics.growth.churnedLast30Days)}
            icon={UserMinus}
            tone="red"
            note={`${formatPercent(analytics.health.churnRate)} customer churn rate`}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.7fr)]">
          <article className="rounded-2xl border border-[#e7e8ef] bg-white p-5 shadow-[0_10px_30px_rgba(30,36,50,0.035)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#292e3d]">Recorded revenue</p>
                <p className="mt-1 text-xs text-[#9095a2]">Captured Razorpay payments · last 12 months</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">{money.format(analytics.revenue.realized)}</p>
                <p className="text-[10px] text-[#959aa7]">{money.format(analytics.revenue.realizedThisMonth)} this month</p>
              </div>
            </div>
            <BarChart
              data={analytics.monthly}
              valueKey="revenue"
              formatValue={(value) => money.format(value)}
              emptyMessage="Revenue history will appear as Razorpay payments are captured."
            />
          </article>

          <article className="rounded-2xl border border-[#e7e8ef] bg-white p-5 shadow-[0_10px_30px_rgba(30,36,50,0.035)] sm:p-6">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="size-[18px] text-[#6f6ad8]" />
              <h2 className="text-sm font-semibold">Revenue health</h2>
            </div>
            <div className="mt-3">
              <MiniStat label="Paying customers" value={number.format(analytics.revenue.payingCustomers)} helper="Portfolio subscriptions with access" />
              <MiniStat label="ARPU" value={money.format(analytics.revenue.arpu)} helper="Monthly revenue per paying customer" />
              <MiniStat label="Free → paid conversion" value={formatPercent(analytics.health.conversionRate)} helper={`${analytics.health.free} accounts remain on One Door`} />
              <MiniStat label="MRR per customer" value={money.format(analytics.revenue.arpu)} helper="Current Portfolio price contribution" />
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <article className="rounded-2xl border border-[#e7e8ef] bg-white p-5 shadow-[0_10px_30px_rgba(30,36,50,0.035)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#292e3d]">User acquisition</p>
                <p className="mt-1 text-xs text-[#9095a2]">New accounts created · last 12 months</p>
              </div>
              <span className="rounded-full bg-[#6f6ad8]/10 px-3 py-1 text-[10px] font-bold text-[#625cc8]">
                {analytics.growth.newLast30Days} LAST 30D
              </span>
            </div>
            <BarChart
              data={analytics.monthly}
              valueKey="signups"
              formatValue={(value) => `${value} ${value === 1 ? "signup" : "signups"}`}
              emptyMessage="No customer signups yet."
            />
          </article>

          <article className="rounded-2xl border border-[#e7e8ef] bg-white p-5 shadow-[0_10px_30px_rgba(30,36,50,0.035)] sm:p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-[18px] text-[#168b72]" />
              <h2 className="text-sm font-semibold">Customer health</h2>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Active · 30d", value: analytics.health.activeLast30Days, detail: formatPercent(analytics.health.activeRate), icon: Activity },
                { label: "Paying", value: analytics.health.paying, detail: formatPercent(analytics.health.conversionRate), icon: CreditCard },
                { label: "Free", value: analytics.health.free, detail: "One Door", icon: DoorOpen },
                { label: "Verified", value: formatPercent(analytics.health.verifiedRate), detail: "of users", icon: CheckCircle2 },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[#ececf2] bg-[#fafafe] p-4">
                  <item.icon className="size-4 text-[#7772d6]" />
                  <p className="mt-5 text-xl font-semibold tracking-[-0.02em]">{item.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-[#777d8b]">{item.label}</p>
                  <p className="text-[10px] text-[#a2a6b1]">{item.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#292e3d]">Product adoption</h2>
              <p className="mt-1 text-xs text-[#9095a2]">How deeply customers are using Bhada</p>
            </div>
            <p className="text-xs font-semibold text-[#168b72]">{formatPercent(analytics.adoption.activationRate)} activated</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Activated accounts", value: analytics.adoption.activatedAccounts, helper: "Added at least 1 property", icon: CheckCircle2 },
              { label: "Properties managed", value: analytics.adoption.totalProperties, helper: "Across customer workspaces", icon: Building2 },
              { label: "Units managed", value: analytics.adoption.totalUnits, helper: `${number.format(analytics.adoption.averageUnitsPerActivatedAccount)} per activated account`, icon: DoorOpen },
              { label: "Active tenants", value: analytics.adoption.activeTenants, helper: `${analytics.adoption.totalTenants} total tenant records`, icon: Users },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-[#e7e8ef] bg-white p-5">
                <div className="flex items-center justify-between">
                  <item.icon className="size-[18px] text-[#6f6ad8]" />
                  <ArrowRight className="size-4 text-[#c1c4cd]" />
                </div>
                <p className="mt-6 text-2xl font-semibold tracking-[-0.03em]">{number.format(item.value)}</p>
                <p className="mt-1 text-xs font-semibold text-[#565d6d]">{item.label}</p>
                <p className="mt-1 text-[10px] text-[#9a9fac]">{item.helper}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e8ef] bg-white shadow-[0_10px_30px_rgba(30,36,50,0.035)]">
          <div className="flex items-center justify-between border-b border-[#e9eaf0] px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-[#292e3d]">Newest accounts</h2>
              <p className="mt-1 text-xs text-[#9095a2]">Latest users to join Bhada</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0a4af]">Last 8</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ececf2] text-[10px] font-bold uppercase tracking-[0.1em] text-[#969ba8]">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Workspace</th>
                  <th className="px-6 py-3.5 text-right">Email</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentAccounts.length ? analytics.recentAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-[#f0f0f4] last:border-0">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#303544]">{account.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#9499a5]">{account.businessName ?? "Workspace not created"}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6e7483]">
                      {account.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                        account.paid ? "bg-[#168b72]/10 text-[#168b72]" : "bg-[#7772d6]/10 text-[#625cc8]",
                      )}>
                        {account.paid ? "PORTFOLIO" : "ONE DOOR"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6e7483]">{account.properties} properties · {account.units} units</td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs text-[#555c6c]">{account.email}</p>
                      <p className={cn("mt-0.5 text-[10px]", account.verified ? "text-[#168b72]" : "text-[#c79729]")}>
                        {account.verified ? "Verified" : "Unverified"}
                      </p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-sm text-[#9499a5]">No customer accounts yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#e3e4ea] pt-5 text-[10px] leading-5 text-[#9ca1ad] sm:flex-row sm:items-center sm:justify-between">
          <p>Owner-only route protected by server-side session and email authorization.</p>
          <p>MRR is entitlement-based. Recorded revenue begins when the billing-event migration and webhook are live.</p>
        </footer>
      </div>
    </main>
  );
}
