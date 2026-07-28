"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  CreditCard,
  Ellipsis,
  FileText,
  HelpCircle,
  Home,
  Menu,
  Plus,
  Search,
  Settings,
  LogOut,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LineChart } from "@/components/ui/line-chart";
import { ProfileForm, type ProfileValues } from "@/app/dashboard/profile/profile-form";
import { chart, payments, properties } from "@/lib/demo-data";
import { authClient } from "@/lib/auth-client";
import { cn, formatCurrency } from "@/lib/utils";

const nav = [
  { label: "Overview", icon: Home },
  { label: "Properties", icon: Building2, count: "4" },
  { label: "Tenants", icon: Users, count: "10" },
  { label: "Payments", icon: CreditCard },
  { label: "Documents", icon: FileText },
];

const statusStyles: Record<string, string> = {
  Paid: "bg-[#e8f5ef] text-[#328161]",
  Overdue: "bg-[#fff0ed] text-[#c65c4d]",
  Upcoming: "bg-[#eef0f9] text-[#626a86]",
};

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export function Dashboard({
  user,
  initialSection = "Overview",
  profile,
}: {
  user: DashboardUser;
  initialSection?: "Overview" | "Profile";
  profile?: ProfileValues;
}) {
  const [active, setActive] = useState<string>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("This year");

  const visiblePayments = useMemo(
    () =>
      payments.filter((payment) =>
        `${payment.tenant} ${payment.property} ${payment.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  function selectSection(section: string) {
    setActive(section);
    setSidebarOpen(false);
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-transparent lg:grid lg:grid-cols-[248px_1fr]">
      {sidebarOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#171a24]/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/70 bg-white/85 px-4 py-5 shadow-[16px_0_50px_rgba(38,42,61,.035)] backdrop-blur-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-11 items-center justify-between px-2">
          <button onClick={() => selectSection("Overview")} className="flex items-center gap-2.5">
            <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#6969e7] to-[#4848bd] text-white shadow-md shadow-indigo-200/70">
              <Building2 className="size-[18px]" strokeWidth={2.4} />
              <span className="absolute -bottom-2 -right-2 size-4 rounded-full bg-[#7e7ee7]" />
            </span>
            <span className="font-display text-[18px] tracking-[-0.04em] text-[#202636]">bhada</span>
          </button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <nav className="mt-8 space-y-1">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a6b3]">Workspace</p>
          {nav.map((item) => (
            <button
              key={item.label}
              onClick={() => selectSection(item.label)}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active === item.label
                  ? "bg-[#efeffd] text-[#4e4ec4]"
                  : "text-[#697081] hover:bg-[#f6f7fa] hover:text-[#2e3443]",
              )}
            >
              <item.icon className="size-[18px]" strokeWidth={active === item.label ? 2.3 : 1.9} />
              <span>{item.label}</span>
              {item.count && (
                <span className="ml-auto rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-[#83899a]">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <nav className="mt-7 space-y-1 border-t border-[#eff0f4] pt-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a6b3]">Manage</p>
          <Link
            href="/dashboard/profile"
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active === "Profile"
                ? "bg-[#efeffd] text-[#4e4ec4]"
                : "text-[#697081] hover:bg-[#f6f7fa] hover:text-[#2e3443]",
            )}
          >
            <Settings className="size-[18px]" /> Settings
          </Link>
          <button className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#697081] hover:bg-[#f6f7fa]">
            <HelpCircle className="size-[18px]" /> Help center
          </button>
        </nav>

        <div className="mt-auto rounded-2xl border border-[#e8e5fb] bg-[#f7f6ff] p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4f4fba]">
            <Sparkles className="size-4" /> Bhada Pro
          </div>
          <p className="mt-2 text-[11px] leading-4 text-[#777795]">Automate reminders and payment receipts.</p>
          <button
            onClick={() => toast("You’re on the demo plan", { description: "Billing is ready to connect when you are." })}
            className="mt-3 text-[11px] font-bold text-[#5555c7] hover:underline"
          >
            Explore features →
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2">
          <div
            className="grid size-9 place-items-center overflow-hidden rounded-full bg-[#272b3a] bg-cover bg-center text-xs font-bold text-white"
            style={user.image ? { backgroundImage: `url("${user.image.replace(/"/g, "%22")}")` } : undefined}
          >
            {!user.image && initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#292f3d]">{user.name}</p>
            <p className="truncate text-[11px] text-[#969baa]">{user.email}</p>
          </div>
          <button onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-8 place-items-center rounded-lg text-[#9298a7] hover:bg-white hover:text-[#5555c7]">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-white/80 bg-white/72 px-4 shadow-[0_1px_20px_rgba(30,36,50,.025)] backdrop-blur-2xl sm:px-7 lg:px-9">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <div className="relative hidden max-w-[360px] flex-1 sm:block">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9aa0af]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tenants, properties..."
              className="h-10 w-full rounded-xl border border-[#e3e5ec] bg-[#fafafd] pl-10 pr-4 text-sm outline-none transition focus:border-[#b6b6ed] focus:bg-white focus:ring-4 focus:ring-[#5b5bd6]/10"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => toast("You’re all caught up", { description: "No new notifications." })}
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#ed7864] ring-2 ring-white" />
            </Button>
            <Button onClick={() => setPaymentOpen(true)}>
              <Plus className="size-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Record payment</span>
              <span className="sm:hidden">Payment</span>
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          {active === "Overview" ? (
            <Overview
              period={period}
              setPeriod={setPeriod}
              payments={visiblePayments}
              onAddProperty={() => setPropertyOpen(true)}
              onRecordPayment={() => setPaymentOpen(true)}
              firstName={firstName}
            />
          ) : active === "Profile" && profile ? (
            <ProfileForm email={user.email} initialValues={profile} />
          ) : (
            <SectionView
              section={active}
              payments={visiblePayments}
              onAddProperty={() => setPropertyOpen(true)}
              onRecordPayment={() => setPaymentOpen(true)}
            />
          )}
        </div>
      </main>

      <RecordPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
      <AddPropertyDialog open={propertyOpen} onOpenChange={setPropertyOpen} />
    </div>
  );
}

function Overview({
  period,
  setPeriod,
  payments: rows,
  onAddProperty,
  onRecordPayment,
  firstName,
}: {
  period: string;
  setPeriod: (value: string) => void;
  payments: typeof payments;
  onAddProperty: () => void;
  onRecordPayment: () => void;
  firstName: string;
}) {
  return (
    <>
      <div className="animate-rise flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-[#888e9d]">Tuesday, July 28</p>
          <h1 className="font-display text-[29px] leading-tight tracking-[-0.045em] text-[#222836] sm:text-[34px]">
            Good evening, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-[#747b8b]">Here&apos;s how your portfolio is doing this month.</p>
        </div>
        <Button variant="outline" onClick={onAddProperty}>
          <Plus className="size-4" /> Add property
        </Button>
      </div>

      <div className="animate-rise-delay mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={WalletCards} label="Monthly income" value="$16,845" note="12.4% vs last month" trend="up" tone="indigo" />
        <MetricCard icon={CircleDollarSign} label="Collected" value="$14,905" note="88.5% collection rate" trend="up" tone="green" />
        <MetricCard icon={CalendarDays} label="Outstanding" value="$1,940" note="1 payment overdue" trend="down" tone="orange" />
        <MetricCard icon={Building2} label="Occupancy" value="83.3%" note="10 of 12 units occupied" trend="up" tone="pink" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold tracking-[-0.025em]">Income overview</h2>
              <p className="mt-1 text-xs text-[#8b91a0]">Rent collected across all properties</p>
            </div>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-9 rounded-lg border border-[#e3e5ec] bg-white px-3 text-xs font-semibold text-[#5f6676] outline-none"
            >
              <option>This year</option>
              <option>Last 6 months</option>
              <option>This quarter</option>
            </select>
          </div>
          <IncomeChart period={period} />
        </section>

        <section className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-base font-bold tracking-[-0.025em]">July rent</h2>
              <p className="mt-1 text-xs text-[#8b91a0]">Payment collection progress</p>
            </div>
            <button className="grid size-8 place-items-center rounded-lg text-[#8b91a0] hover:bg-[#f3f4f7]">
              <Ellipsis className="size-5" />
            </button>
          </div>
          <div className="mt-7 flex items-center gap-6">
            <div className="relative grid size-[118px] shrink-0 place-items-center rounded-full bg-[conic-gradient(#5b5bd6_0_88.5%,#eeeff5_88.5%_100%)]">
              <div className="grid size-[88px] place-items-center rounded-full bg-white text-center">
                <div>
                  <p className="font-display text-xl font-extrabold tracking-[-0.04em]">88.5%</p>
                  <p className="text-[10px] text-[#9298a7]">collected</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <Legend dot="#5b5bd6" label="Paid" value="$14,905" />
              <Legend dot="#eea05a" label="Pending" value="$1,940" />
              <Legend dot="#ea6f62" label="Overdue" value="$1,720" />
            </div>
          </div>
          <Button onClick={onRecordPayment} variant="outline" className="mt-7 w-full">
            View all payments
          </Button>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <PaymentTable rows={rows} />
        <PropertyList onAdd={onAddProperty} />
      </div>
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  trend,
  tone,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  note: string;
  trend: "up" | "down";
  tone: "indigo" | "green" | "orange" | "pink";
}) {
  const tones = {
    indigo: "bg-[#eeeeff] text-[#5656c9]",
    green: "bg-[#e8f6f1] text-[#27836d]",
    orange: "bg-[#fff1e3] text-[#bf7840]",
    pink: "bg-[#f9eaf0] text-[#b85d82]",
  };
  return (
    <article className="group rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(32,38,55,.045)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(32,38,55,.075)]">
      <div className="flex items-center justify-between">
        <span className={cn("grid size-10 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-[19px]" strokeWidth={2.1} />
        </span>
        <button className="text-[#a0a5b2] hover:text-[#666d7d]">
          <Ellipsis className="size-5" />
        </button>
      </div>
      <p className="mt-5 text-xs font-medium text-[#858b9a]">{label}</p>
      <p className="mt-1 font-display text-[23px] tracking-[-0.045em] text-[#242a38]">{value}</p>
      <p className={cn("mt-3 flex items-center gap-1 text-[11px] font-semibold", trend === "up" ? "text-[#479078]" : "text-[#c06b58]")}>
        {trend === "up" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
        {note}
      </p>
    </article>
  );
}

function IncomeChart({ period }: { period: string }) {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const fullData = chart.map((value, index) => ({
    label: months[index],
    value: Math.round(9200 + value * 82),
  }));
  const count = period === "This quarter" ? 3 : period === "Last 6 months" ? 6 : 12;
  const visibleData = fullData.slice(-count);
  return <LineChart key={period} data={visibleData} markerIndex={count > 6 ? 7 : undefined} />;
}

function Legend({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="size-2 rounded-full" style={{ background: dot }} />
      <span className="text-[#7b8291]">{label}</span>
      <span className="ml-auto font-bold text-[#353b49]">{value}</span>
    </div>
  );
}

function PaymentTable({ rows }: { rows: typeof payments }) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      <div className="flex items-center justify-between p-5 pb-4 sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Recent payments</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Latest activity from your tenants</p>
        </div>
        <button className="text-xs font-bold text-[#5b5bd6] hover:text-[#4646b8]">View all</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-y border-[#eef0f4] bg-[#fafafd] text-[10px] uppercase tracking-[0.08em] text-[#989eac]">
              <th className="px-6 py-3 font-bold">Tenant</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="w-12 px-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.slice(0, 4).map((payment) => (
                <tr key={payment.tenant} className="border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full text-[10px] font-extrabold text-[#53596a]" style={{ background: payment.color }}>
                        {payment.initials}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#343a48]">{payment.tenant}</p>
                        <p className="mt-0.5 text-[10px] text-[#989eac]">{payment.property}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-[#343a48]">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3.5 text-xs text-[#7e8595]">{payment.date}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold", statusStyles[payment.status])}>{payment.status}</span>
                  </td>
                  <td className="px-3"><Ellipsis className="size-4 text-[#9ca1af]" /></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-[#8b91a0]">No payments match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PropertyList({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Properties</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Your active portfolio</p>
        </div>
        <button onClick={onAdd} className="grid size-8 place-items-center rounded-lg border border-[#e4e6ed] text-[#6f7686] hover:bg-[#f7f7fa]"><Plus className="size-4" /></button>
      </div>
      <div className="mt-3 divide-y divide-[#eff0f4]">
        {properties.slice(0, 3).map((property) => (
          <div key={property.name} className="flex items-center gap-3 py-3.5">
            <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: property.color }}>
              <Building2 className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#343a48]">{property.name}</p>
              <p className="mt-0.5 text-[10px] text-[#969cab]">{property.units} · {property.occupied}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#343a48]">{formatCurrency(property.income)}</p>
              <p className="mt-0.5 text-[10px] text-[#969cab]">monthly</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full rounded-xl bg-[#f7f7fb] py-2.5 text-xs font-bold text-[#5d6474] hover:bg-[#f0f1f6]">View all properties</button>
    </section>
  );
}

function SectionView({
  section,
  payments: rows,
  onAddProperty,
  onRecordPayment,
}: {
  section: string;
  payments: typeof payments;
  onAddProperty: () => void;
  onRecordPayment: () => void;
}) {
  const descriptions: Record<string, string> = {
    Properties: "Manage buildings, units, and occupancy.",
    Tenants: "Keep every tenant and lease in one place.",
    Payments: "Track paid, pending, and overdue rent.",
    Documents: "Organize leases, receipts, and notices.",
  };
  return (
    <div className="animate-rise">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-[#8a909f]">Portfolio</p>
          <h1 className="mt-1 font-display text-[34px] font-extrabold tracking-[-0.045em]">{section}</h1>
          <p className="mt-1 text-sm text-[#747b8b]">{descriptions[section]}</p>
        </div>
        <Button onClick={section === "Properties" ? onAddProperty : onRecordPayment}>
          <Plus className="size-4" /> {section === "Properties" ? "Add property" : section === "Payments" ? "Record payment" : `Add ${section.slice(0, -1).toLowerCase()}`}
        </Button>
      </div>
      <div className="mt-7">
        {section === "Properties" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <article key={property.name} className="rounded-[20px] border border-[#e7e9ef] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl text-white" style={{ background: property.color }}><Building2 className="size-5" /></span>
                  <Ellipsis className="size-5 text-[#969baa]" />
                </div>
                <h2 className="mt-5 font-display text-lg font-bold">{property.name}</h2>
                <p className="mt-1 text-xs text-[#8c92a1]">{property.address}</p>
                <div className="mt-5 flex items-end justify-between border-t border-[#eff0f4] pt-4">
                  <p className="text-xs text-[#7d8494]">{property.units} · {property.occupied}</p>
                  <p className="font-display text-lg font-extrabold">{formatCurrency(property.income)}<span className="text-[10px] font-medium text-[#999eab]"> /mo</span></p>
                </div>
              </article>
            ))}
          </div>
        ) : section === "Documents" ? (
          <EmptyDocuments />
        ) : (
          <PaymentTable rows={rows} />
        )}
      </div>
    </div>
  );
}

function EmptyDocuments() {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-[24px] border border-dashed border-[#dcdfe8] bg-white p-8 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#efeffd] text-[#5b5bd6]"><FileText className="size-6" /></span>
        <h2 className="mt-5 font-display text-lg font-bold">Bring your documents together</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#858b9a]">Upload leases, move-in checklists, and rent receipts so they’re easy to find.</p>
        <Button className="mt-5" onClick={() => toast.success("Upload area ready")}><Plus className="size-4" /> Upload document</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#4d5362]">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "h-11 w-full rounded-xl border border-[#dfe2e9] bg-[#fafafd] px-3.5 text-sm outline-none transition focus:border-[#aaaaf0] focus:bg-white focus:ring-4 focus:ring-[#5b5bd6]/10";

function RecordPaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onOpenChange(false);
    toast.success("Payment recorded", { description: "The tenant balance and July collection have been updated." });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Record a payment</DialogTitle>
        <DialogDescription>Add an offline rent payment to your ledger.</DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Tenant">
            <select required className={inputClass} defaultValue="">
              <option value="" disabled>Select a tenant</option>
              {payments.map((payment) => <option key={payment.tenant}>{payment.tenant} — {payment.property}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount"><input required className={inputClass} type="number" min="1" placeholder="$ 0.00" /></Field>
            <Field label="Date"><input required className={inputClass} type="date" defaultValue="2026-07-28" /></Field>
          </div>
          <Field label="Payment method">
            <select className={inputClass}><option>Bank transfer</option><option>Cash</option><option>Check</option><option>Card</option></select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit"><Check className="size-4" /> Save payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPropertyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onOpenChange(false);
    toast.success("Property added", { description: "Your new property is ready for units and tenants." });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Add a property</DialogTitle>
        <DialogDescription>Start with the basics. You can add units and leases next.</DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Property name"><input required className={inputClass} placeholder="e.g. Willow Apartments" /></Field>
          <Field label="Street address"><input required className={inputClass} placeholder="123 Main Street" /></Field>
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <Field label="City"><input required className={inputClass} placeholder="Austin" /></Field>
            <Field label="Units"><input required className={inputClass} type="number" min="1" defaultValue="1" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit"><Building2 className="size-4" /> Add property</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
