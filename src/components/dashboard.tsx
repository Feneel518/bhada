"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  Ellipsis,
  Eye,
  FileText,
  Gauge,
  HelpCircle,
  Home,
  LoaderCircle,
  Menu,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings,
  LogOut,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LineChart } from "@/components/ui/line-chart";
import {
  BillDocumentDialog,
  type BillDocument,
  type BillIssuer,
} from "@/components/bill-document";
import { TenantProfileDialog } from "@/components/tenant-profile-dialog";
import { ProfileForm, type ProfileValues } from "@/app/dashboard/profile/profile-form";
import {
  deleteProperty,
  saveProperty,
  type PropertyActionState,
} from "@/app/dashboard/properties/actions";
import {
  deleteTenant,
  saveTenant,
  type TenantActionState,
} from "@/app/dashboard/tenants/actions";
import {
  deleteUnit,
  saveUnit,
  type UnitActionState,
} from "@/app/dashboard/units/actions";
import {
  recordPayment,
  type PaymentActionState,
} from "@/app/dashboard/payments/actions";
import {
  createElectricityBill,
  type ElectricityBillActionState,
} from "@/app/dashboard/electricity/actions";
import { chart } from "@/lib/demo-data";
import { authClient } from "@/lib/auth-client";
import type { PaymentRecord } from "@/lib/payments";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { formatBillingMonth, type FinancialYearOption } from "@/lib/financial-year";
import type { PropertyRecord, UnitRecord, UnitStatus } from "@/lib/properties";
import type { TenantRecord } from "@/lib/tenants";
import type { TenantAnalytics } from "@/lib/tenant-analytics";
import { cn, formatCurrency } from "@/lib/utils";

const nav = [
  { label: "Overview", icon: Home },
  { label: "Properties", icon: Building2, count: "4" },
  { label: "Tenants", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Documents", icon: FileText },
];

const statusStyles: Record<string, string> = {
  Paid: "bg-[#e8f5ef] text-[#328161]",
  Pending: "bg-[#fff4e8] text-[#b66a45]",
  Overpaid: "bg-[#eaf3ff] text-[#3974ad]",
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
  properties,
  tenants,
  payments,
  rentBilling,
  electricityBills,
  financialYearStart,
  financialYearOptions,
  issuer,
  tenantAnalytics,
}: {
  user: DashboardUser;
  initialSection?: "Overview" | "Profile" | "Payments";
  profile?: ProfileValues;
  properties: PropertyRecord[];
  tenants: TenantRecord[];
  payments: PaymentRecord[];
  rentBilling: RentBillingSummary;
  electricityBills: ElectricityBillRecord[];
  financialYearStart: number;
  financialYearOptions: FinancialYearOption[];
  issuer: BillIssuer;
  tenantAnalytics: TenantAnalytics[];
}) {
  const [active, setActive] = useState<string>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [electricityBillOpen, setElectricityBillOpen] = useState(false);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyRecord | null>(null);
  const [unitEditor, setUnitEditor] = useState<{
    property: PropertyRecord;
    unit: UnitRecord | null;
  } | null>(null);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [profileTenant, setProfileTenant] = useState<TenantRecord | null>(null);
  const [billDocument, setBillDocument] = useState<BillDocument | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("This year");

  const visiblePayments = useMemo(
    () =>
      payments.filter((payment) =>
        `${payment.tenant} ${payment.property} ${payment.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [payments, search],
  );
  const visibleProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter((item) =>
      `${item.name} ${item.address} ${item.city} ${item.state} ${item.postalCode}`
        .toLowerCase()
        .includes(query),
    );
  }, [properties, search]);
  const visibleTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter((item) =>
      `${item.name} ${item.email} ${item.phone} ${item.propertyName} ${item.unitNumber}`
        .toLowerCase()
        .includes(query),
    );
  }, [search, tenants]);

  function selectSection(section: string) {
    setActive(section);
    setSidebarOpen(false);
  }

  function openProperty(propertyToEdit: PropertyRecord | null = null) {
    setEditingProperty(propertyToEdit);
    setPropertyOpen(true);
  }

  function openTenant(tenantToEdit: TenantRecord | null = null) {
    setEditingTenant(tenantToEdit);
    setTenantOpen(true);
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
              {(item.count || item.label === "Properties" || item.label === "Tenants") && (
                <span className="ml-auto rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-[#83899a]">
                  {item.label === "Properties" ? properties.length : item.label === "Tenants" ? tenants.length : item.count}
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
              rentBilling={rentBilling}
              properties={visibleProperties}
              onAddProperty={() => openProperty()}
              onRecordPayment={() => setPaymentOpen(true)}
              onViewProperties={() => selectSection("Properties")}
              firstName={firstName}
            />
          ) : active === "Profile" && profile ? (
            <ProfileForm email={user.email} initialValues={profile} />
          ) : (
            <SectionView
              section={active}
              payments={visiblePayments}
              rentBilling={rentBilling}
              electricityBills={electricityBills}
              financialYearStart={financialYearStart}
              financialYearOptions={financialYearOptions}
              properties={visibleProperties}
              tenants={visibleTenants}
              onAddProperty={() => openProperty()}
              onEditProperty={openProperty}
              onAddUnit={(property) => setUnitEditor({ property, unit: null })}
              onEditUnit={(property, unit) => setUnitEditor({ property, unit })}
              onRecordPayment={() => setPaymentOpen(true)}
              onAddElectricityBill={() => setElectricityBillOpen(true)}
              onAddTenant={() => openTenant()}
              onEditTenant={openTenant}
              onViewTenant={setProfileTenant}
              onViewRentBill={(bill) => setBillDocument({
                kind: "rent",
                bill,
                tenant: tenants.find((item) => item.id === bill.tenantId) ?? null,
              })}
              onViewElectricityBill={(bill) => setBillDocument({
                kind: "electricity",
                bill,
                tenant: bill.tenantId
                  ? tenants.find((item) => item.id === bill.tenantId) ?? null
                  : null,
              })}
            />
          )}
        </div>
      </main>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        tenants={tenants}
      />
      <ElectricityBillDialog
        open={electricityBillOpen}
        onOpenChange={setElectricityBillOpen}
        properties={properties}
      />
      {propertyOpen && (
        <PropertyDialog
          property={editingProperty}
          open
          onOpenChange={setPropertyOpen}
        />
      )}
      {unitEditor && (
        <UnitDialog
          property={unitEditor.property}
          unit={unitEditor.unit}
          open
          onOpenChange={(open) => {
            if (!open) setUnitEditor(null);
          }}
        />
      )}
      {tenantOpen && (
        <TenantDialog
          tenant={editingTenant}
          properties={properties}
          open
          onOpenChange={(open) => {
            setTenantOpen(open);
            if (!open) setEditingTenant(null);
          }}
        />
      )}
      <BillDocumentDialog
        document={billDocument}
        issuer={issuer}
        onClose={() => setBillDocument(null)}
      />
      <TenantProfileDialog
        tenant={profileTenant}
        analytics={profileTenant
          ? tenantAnalytics.find((item) => item.tenantId === profileTenant.id) ?? null
          : null}
        payments={payments}
        rentBills={rentBilling.bills}
        electricityBills={electricityBills}
        financialYearLabel={rentBilling.financialYearLabel}
        onClose={() => setProfileTenant(null)}
      />
    </div>
  );
}

function Overview({
  period,
  setPeriod,
  payments: rows,
  rentBilling,
  properties,
  onAddProperty,
  onRecordPayment,
  onViewProperties,
  firstName,
}: {
  period: string;
  setPeriod: (value: string) => void;
  payments: PaymentRecord[];
  rentBilling: RentBillingSummary;
  properties: PropertyRecord[];
  onAddProperty: () => void;
  onRecordPayment: () => void;
  onViewProperties: () => void;
  firstName: string;
}) {
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <>
      <div className="animate-rise flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-[#888e9d]">{todayLabel}</p>
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
        <MetricCard icon={WalletCards} label="Billed this month" value={formatCurrency(rentBilling.billedThisMonth)} note={`${rentBilling.periodLabel} rent bills`} trend="up" tone="indigo" />
        <MetricCard icon={CircleDollarSign} label="Collected" value={formatCurrency(rentBilling.paidThisMonth)} note={`${rentBilling.collectionRate}% collection rate`} trend="up" tone="green" />
        <MetricCard icon={CalendarDays} label="Pending rent" value={formatCurrency(rentBilling.pendingTotal)} note={`${rentBilling.overdueCount} overdue bill${rentBilling.overdueCount === 1 ? "" : "s"}`} trend="down" tone="orange" />
        <MetricCard icon={Building2} label="Active properties" value={String(properties.length)} note="Across your portfolio" trend="up" tone="pink" />
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
              <h2 className="font-display text-base font-bold tracking-[-0.025em]">{rentBilling.periodLabel} rent</h2>
              <p className="mt-1 text-xs text-[#8b91a0]">Payment collection progress</p>
            </div>
            <button className="grid size-8 place-items-center rounded-lg text-[#8b91a0] hover:bg-[#f3f4f7]">
              <Ellipsis className="size-5" />
            </button>
          </div>
          <div className="mt-7 flex items-center gap-6">
            <div
              className="relative grid size-[118px] shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(#5b5bd6 0 ${rentBilling.collectionRate}%, #eeeff5 ${rentBilling.collectionRate}% 100%)` }}
            >
              <div className="grid size-[88px] place-items-center rounded-full bg-white text-center">
                <div>
                  <p className="font-display text-xl font-extrabold tracking-[-0.04em]">{rentBilling.collectionRate}%</p>
                  <p className="text-[10px] text-[#9298a7]">collected</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <Legend dot="#5b5bd6" label="Paid" value={formatCurrency(rentBilling.paidThisMonth)} />
              <Legend dot="#eea05a" label="Pending" value={formatCurrency(rentBilling.pendingThisMonth)} />
              <Legend dot="#ea6f62" label="Overdue" value={formatCurrency(rentBilling.overdueTotal)} />
            </div>
          </div>
          <Button onClick={onRecordPayment} variant="outline" className="mt-7 w-full">
            View all payments
          </Button>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <PaymentTable rows={rows} />
        <PropertyList properties={properties} onAdd={onAddProperty} onViewAll={onViewProperties} />
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

function PaymentTable({ rows }: { rows: PaymentRecord[] }) {
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
              <th className="px-4 py-3 font-bold">Balance</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="w-12 px-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.slice(0, 8).map((payment) => (
                <tr key={payment.id} className="border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full text-[10px] font-extrabold text-[#53596a]" style={{ background: payment.color }}>
                        {payment.initials}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#343a48]">{payment.tenant}</p>
                        <p className="mt-0.5 text-[10px] text-[#989eac]">{payment.property} · {payment.summary}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-[#343a48]">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3.5 text-xs text-[#7e8595]">{payment.date}</td>
                  <td className={cn(
                    "px-4 py-3.5 text-xs font-bold",
                    payment.status === "Pending"
                      ? "text-[#b66a45]"
                      : payment.status === "Overpaid"
                        ? "text-[#3974ad]"
                        : "text-[#328161]",
                  )}>
                    {payment.status === "Paid" ? "—" : formatCurrency(payment.balance)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold", statusStyles[payment.status])}>{payment.status}</span>
                  </td>
                  <td className="px-3"><Ellipsis className="size-4 text-[#9ca1af]" /></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#8b91a0]">No payments match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const propertyColors = ["#5b5bd6", "#16a39a", "#e8994f", "#c1688d", "#4776bd"];

function propertyColor(id: string) {
  const index =
    Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0) %
    propertyColors.length;
  return propertyColors[index];
}

function PropertyList({
  properties,
  onAdd,
  onViewAll,
}: {
  properties: PropertyRecord[];
  onAdd: () => void;
  onViewAll: () => void;
}) {
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
          <div key={property.id} className="flex items-center gap-3 py-3.5">
            <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: propertyColor(property.id) }}>
              <Building2 className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#343a48]">{property.name}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#969cab]">{property.city}{property.state ? `, ${property.state}` : ""}</p>
            </div>
            <MapPin className="size-4 shrink-0 text-[#a0a5b2]" />
          </div>
        ))}
        {!properties.length && (
          <div className="py-8 text-center text-xs text-[#8b91a0]">
            No properties yet. Add your first one to get started.
          </div>
        )}
      </div>
      <button onClick={onViewAll} className="mt-3 w-full rounded-xl bg-[#f7f7fb] py-2.5 text-xs font-bold text-[#5d6474] hover:bg-[#f0f1f6]">View all properties</button>
    </section>
  );
}

function SectionView({
  section,
  payments: rows,
  rentBilling,
  electricityBills,
  financialYearStart,
  financialYearOptions,
  properties,
  tenants,
  onAddProperty,
  onEditProperty,
  onAddUnit,
  onEditUnit,
  onRecordPayment,
  onAddElectricityBill,
  onAddTenant,
  onEditTenant,
  onViewTenant,
  onViewRentBill,
  onViewElectricityBill,
}: {
  section: string;
  payments: PaymentRecord[];
  rentBilling: RentBillingSummary;
  electricityBills: ElectricityBillRecord[];
  financialYearStart: number;
  financialYearOptions: FinancialYearOption[];
  properties: PropertyRecord[];
  tenants: TenantRecord[];
  onAddProperty: () => void;
  onEditProperty: (property: PropertyRecord) => void;
  onAddUnit: (property: PropertyRecord) => void;
  onEditUnit: (property: PropertyRecord, unit: UnitRecord) => void;
  onRecordPayment: () => void;
  onAddElectricityBill: () => void;
  onAddTenant: () => void;
  onEditTenant: (tenant: TenantRecord) => void;
  onViewTenant: (tenant: TenantRecord) => void;
  onViewRentBill: (bill: RentBillingSummary["bills"][number]) => void;
  onViewElectricityBill: (bill: ElectricityBillRecord) => void;
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
        <div className="flex flex-wrap gap-2">
          {section === "Payments" && (
            <Button variant="outline" onClick={onAddElectricityBill}>
              <Plus className="size-4" /> Add electricity bill
            </Button>
          )}
          <Button onClick={section === "Properties" ? onAddProperty : section === "Tenants" ? onAddTenant : onRecordPayment}>
            <Plus className="size-4" /> {section === "Properties" ? "Add property" : section === "Payments" ? "Record payment" : `Add ${section.slice(0, -1).toLowerCase()}`}
          </Button>
        </div>
      </div>
      <div className="mt-7">
        {section === "Properties" ? (
          properties.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onEdit={onEditProperty}
                  onAddUnit={onAddUnit}
                  onEditUnit={onEditUnit}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-dashed border-[#dcdfe8] bg-white p-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#efeffd] text-[#5b5bd6]"><Building2 className="size-6" /></span>
                <h2 className="mt-5 font-display text-lg font-bold">No properties found</h2>
                <p className="mt-2 text-sm text-[#858b9a]">Add a property or clear your search to see your portfolio.</p>
                <Button className="mt-5" onClick={onAddProperty}><Plus className="size-4" /> Add property</Button>
              </div>
            </div>
          )
        ) : section === "Tenants" ? (
          <TenantList
            tenants={tenants}
            onAdd={onAddTenant}
            onEdit={onEditTenant}
            onView={onViewTenant}
          />
        ) : section === "Documents" ? (
          <EmptyDocuments />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[20px] border border-[#e7e9ef] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-xs font-bold text-[#4d5362]">Financial year</p>
                <p className="mt-1 text-[11px] text-[#8b91a0]">Only the selected April–March period is loaded.</p>
              </div>
              <select
                className="h-10 w-full rounded-xl border border-[#dfe2e9] bg-[#fafafd] px-3 text-sm font-semibold outline-none focus:border-[#aaaaf0] sm:w-44"
                value={financialYearStart}
                onChange={(event) => {
                  window.location.assign(`/dashboard?section=Payments&fy=${event.target.value}`);
                }}
              >
                {financialYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <RentBillTable
              bills={rentBilling.bills}
              financialYearLabel={rentBilling.financialYearLabel}
              onViewBill={onViewRentBill}
            />
            <ElectricityBillTable
              bills={electricityBills}
              financialYearLabel={rentBilling.financialYearLabel}
              onViewBill={onViewElectricityBill}
            />
            <PaymentTable rows={rows} />
          </div>
        )}
      </div>
    </div>
  );
}

function RentBillTable({
  bills,
  financialYearLabel,
  onViewBill,
}: {
  bills: RentBillingSummary["bills"];
  financialYearLabel: string;
  onViewBill: (bill: RentBillingSummary["bills"][number]) => void;
}) {
  const [billSearch, setBillSearch] = useState("");
  const visibleBills = bills.filter((bill) =>
    bill.billNumber.toLowerCase().includes(billSearch.trim().toLowerCase()),
  );

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      <div className="flex flex-col gap-4 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Rent bills · {financialYearLabel}</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Selected financial year (April–March)</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa0af]" />
          <input
            className="h-9 w-full rounded-lg border border-[#e3e5ec] bg-[#fafafd] pl-9 pr-3 text-xs outline-none focus:border-[#aaaaf0]"
            value={billSearch}
            onChange={(event) => setBillSearch(event.target.value)}
            placeholder="Search bill number"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-left md:min-w-[720px]">
          <thead>
            <tr className="border-y border-[#eef0f4] bg-[#fafafd] text-[10px] uppercase tracking-[0.08em] text-[#989eac]">
              <th className="px-6 py-3 font-bold">Bill</th>
              <th className="px-4 py-3 font-bold">Bill month</th>
              <th className="hidden px-4 py-3 font-bold lg:table-cell">Tenant</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Payable</th>
              <th className="px-4 py-3 font-bold">Pending</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Due date</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Copy</th>
            </tr>
          </thead>
          <tbody>
            {visibleBills.length ? visibleBills.map((bill) => (
              <tr key={bill.id} className="border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]">
                <td className="px-6 py-3.5">
                  <p className="text-xs font-bold text-[#343a48]">{bill.billNumber}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#5f6676]">{formatBillingMonth(bill.billingPeriod)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-[#5f6676] lg:table-cell">{bill.tenantName}</td>
                <td className="hidden px-4 py-3.5 md:table-cell">
                  <p className="text-xs font-bold text-[#343a48]">{formatCurrency(bill.amount)}</p>
                  {(bill.gstAmount > 0 || bill.tdsAmount > 0) && (
                    <p className="mt-1 text-[10px] font-medium text-[#8b91a0]">
                      {formatCurrency(bill.baseAmount)}
                      {bill.gstAmount > 0 ? ` + ${formatCurrency(bill.gstAmount)} GST` : ""}
                      {bill.tdsAmount > 0 ? ` - ${formatCurrency(bill.tdsAmount)} TDS` : ""}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-[#7e8595] md:table-cell">{bill.dueDate}</td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                    bill.status === "Paid"
                      ? statusStyles.Paid
                      : bill.status === "Overdue"
                        ? statusStyles.Overdue
                        : statusStyles.Upcoming,
                  )}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onViewBill(bill)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe2e9] px-2.5 py-1.5 text-[10px] font-bold text-[#5555c7] hover:bg-[#efeffd]"
                  >
                    <Eye className="size-3.5" /> View
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#8b91a0]">
                  {billSearch ? "No rent bill matches that bill number." : `No rent bills in ${financialYearLabel}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ElectricityBillTable({
  bills,
  financialYearLabel,
  onViewBill,
}: {
  bills: ElectricityBillRecord[];
  financialYearLabel: string;
  onViewBill: (bill: ElectricityBillRecord) => void;
}) {
  const [billSearch, setBillSearch] = useState("");
  const visibleBills = bills.filter((bill) =>
    bill.billNumber.toLowerCase().includes(billSearch.trim().toLowerCase()),
  );

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      <div className="flex flex-col gap-4 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Electricity bills · {financialYearLabel}</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Selected financial year (April–March)</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa0af]" />
          <input
            className="h-9 w-full rounded-lg border border-[#e3e5ec] bg-[#fafafd] pl-9 pr-3 text-xs outline-none focus:border-[#aaaaf0]"
            value={billSearch}
            onChange={(event) => setBillSearch(event.target.value)}
            placeholder="Search bill number"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left md:min-w-[760px] lg:min-w-[1000px]">
          <thead>
            <tr className="border-y border-[#eef0f4] bg-[#fafafd] text-[10px] uppercase tracking-[0.08em] text-[#989eac]">
              <th className="px-6 py-3 font-bold">Bill</th>
              <th className="px-4 py-3 font-bold">Bill month</th>
              <th className="px-4 py-3 font-bold">Unit</th>
              <th className="hidden px-4 py-3 font-bold xl:table-cell">Tenant</th>
              <th className="hidden px-4 py-3 font-bold lg:table-cell">Meter calculation</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Amount</th>
              <th className="px-4 py-3 font-bold">Pending</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Due date</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Copy</th>
            </tr>
          </thead>
          <tbody>
            {visibleBills.length ? visibleBills.map((bill) => (
              <tr key={bill.id} className="border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]">
                <td className="px-6 py-3.5">
                  <p className="text-xs font-bold text-[#343a48]">{bill.billNumber}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#5f6676]">{formatBillingMonth(bill.billingPeriod)}</td>
                <td className="px-4 py-3.5">
                  <p className="text-xs font-bold text-[#4d5362]">{bill.propertyName}</p>
                  <p className="mt-0.5 text-[10px] text-[#989eac]">Unit {bill.unitNumber}</p>
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-[#5f6676] xl:table-cell">{bill.tenantName}</td>
                <td className="hidden px-4 py-3.5 lg:table-cell">
                  <p className="text-xs font-bold text-[#4d5362]">{bill.previousReading} → {bill.currentReading}</p>
                  <p className="mt-0.5 text-[10px] text-[#989eac]">{bill.unitsConsumed} units × {formatCurrency(bill.unitRate)}</p>
                </td>
                <td className="hidden px-4 py-3.5 text-xs font-bold text-[#343a48] md:table-cell">{formatCurrency(bill.amount)}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-[#7e8595] md:table-cell">{bill.dueDate}</td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                    bill.status === "Paid"
                      ? statusStyles.Paid
                      : bill.status === "Overdue"
                        ? statusStyles.Overdue
                        : statusStyles.Upcoming,
                  )}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onViewBill(bill)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe2e9] px-2.5 py-1.5 text-[10px] font-bold text-[#5555c7] hover:bg-[#efeffd]"
                  >
                    <Eye className="size-3.5" /> View
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-sm text-[#8b91a0]">
                  {billSearch ? "No electricity bill matches that bill number." : `No electricity bills in ${financialYearLabel}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TenantList({
  tenants,
  onAdd,
  onEdit,
  onView,
}: {
  tenants: TenantRecord[];
  onAdd: () => void;
  onEdit: (tenant: TenantRecord) => void;
  onView: (tenant: TenantRecord) => void;
}) {
  if (!tenants.length) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-dashed border-[#dcdfe8] bg-white p-8 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8f5ef] text-[#328161]"><Users className="size-6" /></span>
          <h2 className="mt-5 font-display text-lg font-bold">No tenants found</h2>
          <p className="mt-2 text-sm text-[#858b9a]">Add a tenant or clear your search to see tenant records.</p>
          <Button className="mt-5" onClick={onAdd}><Plus className="size-4" /> Add tenant</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tenants.map((item) => (
        <TenantCard key={item.id} tenant={item} onEdit={onEdit} onView={onView} />
      ))}
    </div>
  );
}

const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function TenantCard({
  tenant: item,
  onEdit,
  onView,
}: {
  tenant: TenantRecord;
  onEdit: (tenant: TenantRecord) => void;
  onView: (tenant: TenantRecord) => void;
}) {
  const [deleting, startDeleteTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete ${item.name}? Related leases and payments will also be deleted.`)) return;
    startDeleteTransition(async () => {
      const result = await deleteTenant(item.id);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <article className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f5ef] text-sm font-extrabold text-[#328161]">
          {item.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-lg font-bold">{item.name}</h2>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", item.isActive ? "bg-[#e8f5ef] text-[#328161]" : "bg-[#eef0f9] text-[#626a86]")}>
              {item.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-[#858b9a]">
            {item.propertyName} · Unit {item.unitNumber}
          </p>
        </div>
        <button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} className="grid size-8 place-items-center rounded-lg text-[#7f8594] hover:bg-[#f2f3f7] hover:text-[#5555c7]">
          <Pencil className="size-4" />
        </button>
        <button type="button" onClick={remove} disabled={deleting} aria-label={`Delete ${item.name}`} className="grid size-8 place-items-center rounded-lg text-[#9a7a78] hover:bg-[#fff0ed] hover:text-[#c65c4d] disabled:opacity-50">
          {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>
      <div className="mt-5 grid gap-3 border-t border-[#eff0f4] pt-4 text-xs text-[#737a8a] sm:grid-cols-2">
        <p className="truncate"><span className="font-bold text-[#4d5362]">Email:</span> {item.email || "Not provided"}</p>
        <p className="truncate"><span className="font-bold text-[#4d5362]">Phone:</span> {item.phone || "Not provided"}</p>
        <p><span className="font-bold text-[#4d5362]">Lease:</span> {item.leaseStart || "—"} to {item.leaseEnd || "—"}</p>
        <p><span className="font-bold text-[#4d5362]">Monthly rent:</span> {item.monthlyRent === null ? "—" : formatInr(item.monthlyRent)}</p>
        <p><span className="font-bold text-[#4d5362]">Billing day:</span> Day {item.rentBillingDay} of each month</p>
        <p>
          <span className="font-bold text-[#4d5362]">Tax on rent:</span>{" "}
          {item.gstEnabled ? `${item.gstRate}% GST` : "No GST"}
          {" · "}
          {item.tdsEnabled ? `${item.tdsRate}% TDS` : "No TDS"}
        </p>
        <p><span className="font-bold text-[#4d5362]">Opening balance:</span> {formatCurrency(item.openingBalance)}</p>
        <p><span className="font-bold text-[#4d5362]">Deposit:</span> {item.securityDeposit === null ? "—" : formatInr(item.securityDeposit)}</p>
      </div>
      <button
        onClick={() => onView(item)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f2f2fd] py-2.5 text-xs font-bold text-[#5555c7] hover:bg-[#e9e9fb]"
      >
        <Eye className="size-4" /> View profile & analytics
      </button>
    </article>
  );
}

function PropertyCard({
  property,
  onEdit,
  onAddUnit,
  onEditUnit,
}: {
  property: PropertyRecord;
  onEdit: (property: PropertyRecord) => void;
  onAddUnit: (property: PropertyRecord) => void;
  onEditUnit: (property: PropertyRecord, unit: UnitRecord) => void;
}) {
  const [deleting, startDeleteTransition] = useTransition();
  const [unitsOpen, setUnitsOpen] = useState(false);
  const location = [property.city, property.state, property.postalCode].filter(Boolean).join(", ");

  function remove() {
    const confirmed = window.confirm(
      `Delete ${property.name}? This will also remove its units, leases, and related payments. This action cannot be undone.`,
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteProperty(property.id);
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <article className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-xl text-white" style={{ background: propertyColor(property.id) }}>
          <Building2 className="size-5" />
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(property)}
            aria-label={`Edit ${property.name}`}
            title="Edit property"
            className="grid size-9 place-items-center rounded-lg text-[#7f8594] transition hover:bg-[#f2f3f7] hover:text-[#5555c7]"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            aria-label={`Delete ${property.name}`}
            title="Delete property"
            className="grid size-9 place-items-center rounded-lg text-[#9a7a78] transition hover:bg-[#fff0ed] hover:text-[#c65c4d] disabled:opacity-50"
          >
            {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        </div>
      </div>
      <h2 className="mt-5 truncate font-display text-lg font-bold">{property.name}</h2>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-[#8c92a1]">{property.address}</p>
      <div className="mt-5 flex items-center gap-2 border-t border-[#eff0f4] pt-4 text-xs text-[#7d8494]">
        <MapPin className="size-4 shrink-0 text-[#979dac]" />
        <span className="truncate">{location || "Location not added"}</span>
        <button
          type="button"
          onClick={() => setUnitsOpen((current) => !current)}
          className="ml-auto flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-bold text-[#5b5bd6] hover:bg-[#efeffd]"
        >
          {property.units.length} {property.units.length === 1 ? "unit" : "units"}
          {unitsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>
      {unitsOpen && (
        <div className="mt-4 border-t border-[#eff0f4] pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#969cab]">Units</p>
            <button
              type="button"
              onClick={() => onAddUnit(property)}
              className="flex items-center gap-1 text-xs font-bold text-[#5b5bd6] hover:text-[#4646b8]"
            >
              <Plus className="size-3.5" /> Add unit
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {property.units.map((item) => (
              <UnitRow
                key={item.id}
                unit={item}
                onEdit={() => onEditUnit(property, item)}
              />
            ))}
            {!property.units.length && (
              <button
                type="button"
                onClick={() => onAddUnit(property)}
                className="w-full rounded-xl border border-dashed border-[#dfe2e9] px-3 py-5 text-xs text-[#858b9a] hover:border-[#bfc2e9] hover:bg-[#fafafd]"
              >
                No units yet. Add the first unit.
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

const unitStatusStyles: Record<UnitStatus, string> = {
  vacant: "bg-[#eef0f9] text-[#626a86]",
  occupied: "bg-[#e8f5ef] text-[#328161]",
  maintenance: "bg-[#fff1e3] text-[#b56d35]",
};

function UnitRow({ unit, onEdit }: { unit: UnitRecord; onEdit: () => void }) {
  const [deleting, startDeleteTransition] = useTransition();

  function remove() {
    const confirmed = window.confirm(
      `Delete unit ${unit.unitNumber}? Its leases and payment history will also be deleted.`,
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteUnit(unit.id);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="rounded-xl border border-[#eceef3] bg-[#fafafd] p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-[#343a48]">Unit {unit.unitNumber}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold capitalize", unitStatusStyles[unit.status])}>
              {unit.status}
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-[#8c92a1]">
            {unit.tenant ? unit.tenant.name : "No active tenant"}
            {unit.floor ? ` · Floor ${unit.floor}` : ""}
            {unit.areaSqft !== null ? ` · ${unit.areaSqft} sq ft` : ""}
          </p>
          {unit.openingMeterReading !== null && (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-[#8c92a1]">
              <Gauge className="size-3" /> Opening {unit.openingMeterReading}
              {unit.openingMeterReadingDate ? ` (${unit.openingMeterReadingDate})` : ""}
              {unit.lastMeterReading !== null ? ` · Latest ${unit.lastMeterReading}` : ""}
            </p>
          )}
        </div>
        <button type="button" onClick={onEdit} aria-label={`Edit unit ${unit.unitNumber}`} className="grid size-7 place-items-center rounded-md text-[#7f8594] hover:bg-white hover:text-[#5555c7]">
          <Pencil className="size-3.5" />
        </button>
        <button type="button" onClick={remove} disabled={deleting} aria-label={`Delete unit ${unit.unitNumber}`} className="grid size-7 place-items-center rounded-md text-[#9a7a78] hover:bg-[#fff0ed] hover:text-[#c65c4d] disabled:opacity-50">
          {deleting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
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

const initialElectricityBillState: ElectricityBillActionState = {
  status: "idle",
  message: "",
};

function ElectricityBillDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: PropertyRecord[];
}) {
  const [state, formAction, pending] = useActionState(
    createElectricityBill,
    initialElectricityBillState,
  );
  const units = properties.flatMap((property) =>
    property.units.map((unit) => ({ property, unit })),
  );
  const today = new Date().toISOString().slice(0, 10);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [unitRate, setUnitRate] = useState("");
  const selectedUnit = units.find(({ unit }) => unit.id === selectedUnitId)?.unit;
  const previousReading = selectedUnit?.lastMeterReading ?? null;
  const unitsConsumed =
    previousReading === null || !currentReading
      ? 0
      : Math.max(0, Number(currentReading) - previousReading);
  const calculatedAmount = unitsConsumed * (Number(unitRate) || 0);

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success("Electricity bill added", { description: state.message });
    onOpenChange(false);
  }, [onOpenChange, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogTitle>Add electricity bill</DialogTitle>
        <DialogDescription>
          Enter this month&apos;s meter reading and rate. Consumption and amount are calculated from the previous reading.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-4">
          <Field label="Property and unit">
            <select
              required
              className={inputClass}
              name="unitId"
              value={selectedUnitId}
              onChange={(event) => {
                setSelectedUnitId(event.target.value);
                setCurrentReading("");
              }}
              aria-invalid={Boolean(state.errors?.unitId)}
            >
              <option value="" disabled>Select a unit</option>
              {units.map(({ property, unit }) => (
                <option key={unit.id} value={unit.id}>
                  {property.name} · Unit {unit.unitNumber}
                  {unit.tenant ? ` · ${unit.tenant.name}` : " · Vacant"}
                </option>
              ))}
            </select>
            {state.errors?.unitId && <FieldError message={state.errors.unitId} />}
            {selectedUnit && previousReading === null && (
              <FieldError message="Edit this unit and set its opening meter reading first." />
            )}
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Billing month">
              <input
                required
                className={inputClass}
                name="billingPeriod"
                type="month"
                defaultValue={today.slice(0, 7)}
                aria-invalid={Boolean(state.errors?.billingPeriod)}
              />
              {state.errors?.billingPeriod && <FieldError message={state.errors.billingPeriod} />}
            </Field>
            <Field label="Current meter reading">
              <input
                required
                className={inputClass}
                name="currentReading"
                type="number"
                min={previousReading ?? 0}
                step="0.001"
                value={currentReading}
                onChange={(event) => setCurrentReading(event.target.value)}
                placeholder={previousReading === null ? "Set opening reading first" : `Previous: ${previousReading}`}
                aria-invalid={Boolean(state.errors?.currentReading)}
              />
              {state.errors?.currentReading && <FieldError message={state.errors.currentReading} />}
            </Field>
            <Field label="Rate per unit (₹)">
              <input
                required
                className={inputClass}
                name="unitRate"
                type="number"
                min="0.0001"
                step="0.0001"
                value={unitRate}
                onChange={(event) => setUnitRate(event.target.value)}
                placeholder="e.g. 8.50"
                aria-invalid={Boolean(state.errors?.unitRate)}
              />
              {state.errors?.unitRate && <FieldError message={state.errors.unitRate} />}
            </Field>
            <Field label="Due date">
              <input
                required
                className={inputClass}
                name="dueDate"
                type="date"
                defaultValue={today}
                aria-invalid={Boolean(state.errors?.dueDate)}
              />
              {state.errors?.dueDate && <FieldError message={state.errors.dueDate} />}
            </Field>
            <Field label="Note">
              <input className={inputClass} name="note" placeholder="Meter bill reference, optional" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#f3f3ff] px-4 py-3.5 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b91a0]">Previous</p>
              <p className="mt-1 text-sm font-extrabold text-[#4444b2]">{previousReading ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b91a0]">Units used</p>
              <p className="mt-1 text-sm font-extrabold text-[#4444b2]">{unitsConsumed.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b91a0]">Bill amount</p>
              <p className="mt-1 text-sm font-extrabold text-[#4444b2]">{formatCurrency(calculatedAmount)}</p>
            </div>
          </div>

          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && (
              <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !units.length || previousReading === null}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Adding..." : "Add bill"}
            </Button>
          </div>
          {!units.length && (
            <p className="text-right text-xs text-[#c65c4d]">Add a property unit first.</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

type AllocationDraft = {
  id: string;
  chargeType: "rent" | "light_bill" | "other";
  description: string;
  billReference: string;
  amount: string;
  gstRate: string;
};

const initialPaymentState: PaymentActionState = { status: "idle", message: "" };

function emptyAllocation(id = "initial"): AllocationDraft {
  return { id, chargeType: "rent", description: "", billReference: "", amount: "", gstRate: "0" };
}

function RecordPaymentDialog({
  open,
  onOpenChange,
  tenants,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: TenantRecord[];
}) {
  const [state, formAction, pending] = useActionState(recordPayment, initialPaymentState);
  const [mode, setMode] = useState<"lump_sum" | "bill_wise">("lump_sum");
  const [allocations, setAllocations] = useState<AllocationDraft[]>([
    { ...emptyAllocation(), chargeType: "rent", description: "Monthly rent" },
  ]);

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success("Payment recorded", { description: state.message });
    onOpenChange(false);
  }, [onOpenChange, state]);

  function changeMode(nextMode: "lump_sum" | "bill_wise") {
    setMode(nextMode);
    setAllocations(
      nextMode === "lump_sum"
        ? [{ ...emptyAllocation(), chargeType: "rent", description: "Monthly rent" }]
        : [emptyAllocation()],
    );
  }

  function updateAllocation(id: string, values: Partial<AllocationDraft>) {
    setAllocations((current) =>
      current.map((allocation) => allocation.id === id ? { ...allocation, ...values } : allocation),
    );
  }

  const total = allocations.reduce((sum, allocation) => {
    const amount = Number(allocation.amount) || 0;
    return sum + amount + (amount * (Number(allocation.gstRate) || 0)) / 100;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[780px] overflow-y-auto">
        <DialogTitle>Record a payment</DialogTitle>
        <DialogDescription>
          Record a lump-sum receipt or allocate it bill by bill, including GST where applicable.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="allocationMode" value={mode} />
          <input
            type="hidden"
            name="allocations"
            value={JSON.stringify(allocations.map((allocation) => ({
              chargeType: allocation.chargeType,
              description: allocation.description,
              billReference: allocation.billReference,
              amount: allocation.amount,
              gstRate: allocation.gstRate,
            })))}
          />
          <Field label="Tenant">
            <select required className={inputClass} name="tenantId" defaultValue="" aria-invalid={Boolean(state.errors?.tenantId)}>
              <option value="" disabled>Select a tenant</option>
              {tenants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.propertyName} · Unit {item.unitNumber}
                </option>
              ))}
            </select>
            {state.errors?.tenantId && <FieldError message={state.errors.tenantId} />}
          </Field>

          <div>
            <p className="mb-2 text-xs font-bold text-[#4d5362]">Allocation</p>
            <div className="grid grid-cols-2 rounded-xl bg-[#f4f4f9] p-1">
              {([
                ["lump_sum", "Lump sum"],
                ["bill_wise", "Bill wise"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeMode(value)}
                  className={cn(
                    "h-9 rounded-lg text-xs font-bold transition",
                    mode === value ? "bg-white text-[#5151c4] shadow-sm" : "text-[#7d8392]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === "lump_sum" ? (
            <PaymentAmountFields
              allocation={allocations[0]}
              onChange={(values) => updateAllocation(allocations[0].id, values)}
            />
          ) : (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#4d5362]">Bills paid</p>
                  <p className="mt-1 text-[11px] text-[#8b91a0]">Add rent, light bill, or any other charge.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllocations((current) => [...current, emptyAllocation(crypto.randomUUID())])}
                >
                  <Plus className="size-3.5" /> Add bill
                </Button>
              </div>
              {allocations.map((allocation, index) => (
                <div key={allocation.id} className="rounded-2xl border border-[#e4e6ed] bg-[#fcfcfe] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9298a7]">Bill {index + 1}</p>
                    {allocations.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove bill ${index + 1}`}
                        onClick={() => setAllocations((current) => current.filter((item) => item.id !== allocation.id))}
                        className="grid size-8 place-items-center rounded-lg text-[#b06b62] hover:bg-[#fff0ed]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Charge type">
                      <select
                        className={inputClass}
                        value={allocation.chargeType}
                        onChange={(event) => updateAllocation(allocation.id, {
                          chargeType: event.target.value as AllocationDraft["chargeType"],
                        })}
                      >
                        <option value="rent">Rent</option>
                        <option value="light_bill">Light bill</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Bill number / month">
                      <input
                        className={inputClass}
                        value={allocation.billReference}
                        onChange={(event) => updateAllocation(allocation.id, { billReference: event.target.value })}
                        placeholder="e.g. July 2026 or LB-104"
                      />
                    </Field>
                    {allocation.chargeType === "other" && (
                      <Field label="Description">
                        <input
                          className={inputClass}
                          value={allocation.description}
                          onChange={(event) => updateAllocation(allocation.id, { description: event.target.value })}
                          placeholder="Maintenance, parking, etc."
                        />
                      </Field>
                    )}
                    <PaymentAmountFields
                      allocation={allocation}
                      onChange={(values) => updateAllocation(allocation.id, values)}
                      compact
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          {state.errors?.allocations && <FieldError message={state.errors.allocations} />}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Payment date">
              <input
                required
                className={inputClass}
                name="paidAt"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                aria-invalid={Boolean(state.errors?.paidAt)}
              />
              {state.errors?.paidAt && <FieldError message={state.errors.paidAt} />}
            </Field>
            <Field label="Payment method">
              <select className={inputClass} name="method" defaultValue="bank_transfer">
                <option value="bank_transfer">Bank transfer / UPI</option>
                <option value="cash">Cash</option>
                <option value="check">Cheque</option>
                <option value="card">Card</option>
              </select>
            </Field>
            <Field label="Transaction reference">
              <input className={inputClass} name="reference" placeholder="UTR, cheque no., etc." />
            </Field>
            <Field label="Note">
              <input className={inputClass} name="note" placeholder="Optional note" />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[#f3f3ff] px-4 py-3.5">
            <span className="text-xs font-bold text-[#646a79]">Total received</span>
            <span className="font-display text-xl font-extrabold text-[#4444b2]">{formatCurrency(total)}</span>
          </div>

          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending || !tenants.length || total <= 0}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Saving..." : "Save payment"}
            </Button>
          </div>
          {!tenants.length && <p className="text-right text-xs text-[#c65c4d]">Add a tenant before recording a payment.</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentAmountFields({
  allocation,
  onChange,
  compact = false,
}: {
  allocation: AllocationDraft;
  onChange: (values: Partial<AllocationDraft>) => void;
  compact?: boolean;
}) {
  const hasGst = Number(allocation.gstRate) > 0;
  return (
    <>
      <Field label={compact ? "Amount before GST (₹)" : "Amount received before GST (₹)"}>
        <input
          required
          className={inputClass}
          type="number"
          min="0.01"
          step="0.01"
          value={allocation.amount}
          onChange={(event) => onChange({ amount: event.target.value })}
          placeholder="0.00"
        />
      </Field>
      <div className={compact ? "" : "grid gap-3 sm:grid-cols-2"}>
        <label className="flex h-11 items-center gap-3 rounded-xl border border-[#dfe2e9] bg-[#fafafd] px-3.5 text-xs font-bold text-[#606777]">
          <input
            className="size-4 accent-[#5555c7]"
            type="checkbox"
            checked={hasGst}
            onChange={(event) => onChange({ gstRate: event.target.checked ? "18" : "0" })}
          />
          Include GST
        </label>
        {hasGst && (
          <Field label="GST rate (%)">
            <input
              required
              className={inputClass}
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={allocation.gstRate}
              onChange={(event) => onChange({ gstRate: event.target.value })}
            />
          </Field>
        )}
      </div>
    </>
  );
}

const initialPropertyState: PropertyActionState = {
  status: "idle",
  message: "",
};

function PropertyDialog({
  property,
  open,
  onOpenChange,
}: {
  property: PropertyRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(saveProperty, initialPropertyState);
  const editing = Boolean(property);

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success(state.message, {
      description: editing
        ? "Your property details are now up to date."
        : "Your new property is ready for units and tenants.",
    });
    onOpenChange(false);
  }, [editing, onOpenChange, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{editing ? "Edit property" : "Add a property"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Update the address and location details for this property."
            : "Start with the property basics. You can add units and leases next."}
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={property?.id ?? ""} />
          <Field label="Property name">
            <input
              required
              className={inputClass}
              name="name"
              defaultValue={property?.name}
              aria-invalid={Boolean(state.errors?.name)}
              placeholder="e.g. Willow Apartments"
            />
            {state.errors?.name && <FieldError message={state.errors.name} />}
          </Field>
          <Field label="Street address">
            <input
              className={inputClass}
              name="address"
              defaultValue={property?.address}
              aria-invalid={Boolean(state.errors?.address)}
              autoComplete="street-address"
              placeholder="123 Main Street"
            />
            {state.errors?.address && <FieldError message={state.errors.address} />}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City">
              <input
                className={inputClass}
                name="city"
                defaultValue={property?.city}
                aria-invalid={Boolean(state.errors?.city)}
                autoComplete="address-level2"
                placeholder="Mumbai"
              />
              {state.errors?.city && <FieldError message={state.errors.city} />}
            </Field>
            <Field label="State">
              <input
                className={inputClass}
                name="state"
                defaultValue={property?.state}
                autoComplete="address-level1"
                placeholder="Maharashtra"
              />
            </Field>
          </div>
          <Field label="Postal code">
            <input
              className={inputClass}
              name="postalCode"
              defaultValue={property?.postalCode}
              autoComplete="postal-code"
              maxLength={12}
              placeholder="400001"
            />
          </Field>
          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && (
              <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : editing ? <Check className="size-4" /> : <Building2 className="size-4" />}
              {pending ? "Saving..." : editing ? "Save changes" : "Add property"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1.5 text-xs font-medium text-[#c65c4d]">{message}</p>;
}

const initialUnitState: UnitActionState = {
  status: "idle",
  message: "",
};

function UnitDialog({
  property,
  unit,
  open,
  onOpenChange,
}: {
  property: PropertyRecord;
  unit: UnitRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(saveUnit, initialUnitState);
  const editing = Boolean(unit);

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success(state.message, {
      description: `${property.name} now has the latest unit details.`,
    });
    onOpenChange(false);
  }, [onOpenChange, property.name, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px]">
        <DialogTitle>{editing ? `Edit unit ${unit?.unitNumber}` : "Add a unit"}</DialogTitle>
        <DialogDescription>
          {property.name} · Track availability, area, floor, and meter readings.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={unit?.id ?? ""} />
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Unit number">
              <input
                required
                className={inputClass}
                name="unitNumber"
                defaultValue={unit?.unitNumber}
                aria-invalid={Boolean(state.errors?.unitNumber)}
                placeholder="e.g. 2A"
              />
              {state.errors?.unitNumber && <FieldError message={state.errors.unitNumber} />}
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                name="status"
                defaultValue={unit?.status ?? "vacant"}
                aria-invalid={Boolean(state.errors?.status)}
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
              {state.errors?.status && <FieldError message={state.errors.status} />}
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Floor">
              <input
                className={inputClass}
                name="floor"
                defaultValue={unit?.floor}
                placeholder="e.g. Ground or 2"
              />
            </Field>
            <Field label="Area (sq ft)">
              <input
                className={inputClass}
                name="areaSqft"
                type="number"
                min="0"
                step="any"
                defaultValue={unit?.areaSqft ?? ""}
                aria-invalid={Boolean(state.errors?.areaSqft)}
                placeholder="850"
              />
              {state.errors?.areaSqft && <FieldError message={state.errors.areaSqft} />}
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Opening meter reading">
              <input
                className={inputClass}
                name="openingMeterReading"
                type="number"
                min="0"
                step="0.001"
                defaultValue={unit?.openingMeterReading ?? ""}
                aria-invalid={Boolean(state.errors?.openingMeterReading)}
                placeholder="0"
              />
              {state.errors?.openingMeterReading && <FieldError message={state.errors.openingMeterReading} />}
            </Field>
            <Field label="Opening reading month">
              <input
                className={inputClass}
                name="openingMeterReadingDate"
                type="month"
                defaultValue={unit?.openingMeterReadingDate}
                aria-invalid={Boolean(state.errors?.openingMeterReadingDate)}
              />
              {state.errors?.openingMeterReadingDate && <FieldError message={state.errors.openingMeterReadingDate} />}
            </Field>
          </div>
          {unit && unit.lastMeterReading !== null && (
            <p className="rounded-xl bg-[#f7f7fb] px-4 py-3 text-xs text-[#6f7686]">
              Latest billed reading: <span className="font-bold text-[#4d5362]">{unit.lastMeterReading}</span>
              {unit.lastMeterReadingDate ? ` (${unit.lastMeterReadingDate.slice(0, 7)})` : ""}
            </p>
          )}
          {unit?.tenant && (
            <div className="rounded-xl border border-[#e3eee9] bg-[#f3faf7] px-4 py-3 text-xs text-[#497365]">
              <span className="font-bold">Active tenant:</span> {unit.tenant.name} · {unit.tenant.email}
            </div>
          )}
          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && (
              <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Saving..." : editing ? "Save changes" : "Add unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const initialTenantState: TenantActionState = {
  status: "idle",
  message: "",
};

function TenantDialog({
  tenant,
  properties,
  open,
  onOpenChange,
}: {
  tenant: TenantRecord | null;
  properties: PropertyRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(saveTenant, initialTenantState);
  const editing = Boolean(tenant);
  const [gstEnabled, setGstEnabled] = useState(tenant?.gstEnabled ?? false);
  const [gstRate, setGstRate] = useState(String(tenant?.gstRate || 18));
  const [tdsEnabled, setTdsEnabled] = useState(tenant?.tdsEnabled ?? false);
  const [tdsRate, setTdsRate] = useState(String(tenant?.tdsRate || 10));
  const [monthlyRent, setMonthlyRent] = useState(String(tenant?.monthlyRent ?? ""));
  const baseRent = Math.max(0, Number(monthlyRent) || 0);
  const previewGst = gstEnabled ? (baseRent * (Number(gstRate) || 0)) / 100 : 0;
  const previewTds = tdsEnabled
    ? ((baseRent + previewGst) * (Number(tdsRate) || 0)) / 100
    : 0;
  const previewPayable = baseRent + previewGst - previewTds;
  const units = properties.flatMap((item) =>
    item.units.map((unit) => ({
      id: unit.id,
      label: `${item.name} · Unit ${unit.unitNumber}`,
    })),
  );

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success(state.message);
    onOpenChange(false);
  }, [onOpenChange, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto">
        <DialogTitle>{editing ? `Edit ${tenant?.name}` : "Add a tenant"}</DialogTitle>
        <DialogDescription>
          Store contact, lease, escalation, and carry-forward credit details. Sensitive IDs remain masked.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="id" value={tenant?.id ?? ""} />

          <section className="space-y-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b91a0]">Tenant & unit</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <input required className={inputClass} name="name" defaultValue={tenant?.name} aria-invalid={Boolean(state.errors?.name)} autoComplete="name" placeholder="Tenant name" />
                {state.errors?.name && <FieldError message={state.errors.name} />}
              </Field>
              <Field label="Unit">
                <select required className={inputClass} name="unitId" defaultValue={tenant?.unitId ?? ""} aria-invalid={Boolean(state.errors?.unitId)}>
                  <option value="" disabled>Select a unit</option>
                  {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
                </select>
                {state.errors?.unitId && <FieldError message={state.errors.unitId} />}
              </Field>
              <Field label="Email">
                <input className={inputClass} name="email" type="email" defaultValue={tenant?.email} aria-invalid={Boolean(state.errors?.email)} autoComplete="email" placeholder="name@example.com" />
                {state.errors?.email && <FieldError message={state.errors.email} />}
              </Field>
              <Field label="Phone">
                <input className={inputClass} name="phone" type="tel" defaultValue={tenant?.phone} autoComplete="tel" placeholder="+91 98765 43210" />
              </Field>
              <Field label="Emergency contact">
                <input className={inputClass} name="emergencyContact" defaultValue={tenant?.emergencyContact} placeholder="Contact name" />
              </Field>
              <Field label="Emergency phone">
                <input className={inputClass} name="emergencyPhone" type="tel" defaultValue={tenant?.emergencyPhone} placeholder="+91 98765 43210" />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-[#eff0f4] pt-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b91a0]">Masked identity details</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Aadhaar last 4">
                <input className={inputClass} name="aadhaarLast4" inputMode="numeric" maxLength={4} defaultValue={tenant?.aadhaarMasked.slice(-4)} aria-invalid={Boolean(state.errors?.aadhaarLast4)} placeholder="1234" />
                {state.errors?.aadhaarLast4 && <FieldError message={state.errors.aadhaarLast4} />}
              </Field>
              <Field label="PAN number">
                <input
                  className={inputClass}
                  name="panMasked"
                  maxLength={10}
                  defaultValue={tenant?.panMasked}
                  aria-invalid={Boolean(state.errors?.panMasked)}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="ABCDE1234F"
                />
                {state.errors?.panMasked && <FieldError message={state.errors.panMasked} />}
                {!state.errors?.panMasked && <p className="mt-1.5 text-[10px] text-[#8b91a0]">Automatically stored as AB***1234F.</p>}
              </Field>
              <Field label="GSTIN">
                <input className={inputClass} name="gstin" maxLength={15} defaultValue={tenant?.gstin} placeholder="Optional" />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-[#eff0f4] pt-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b91a0]">Lease terms</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TenantInput label="Lease start" name="leaseStart" type="date" value={tenant?.leaseStart} error={state.errors?.leaseStart} />
              <TenantInput label="Lease end" name="leaseEnd" type="date" value={tenant?.leaseEnd} error={state.errors?.leaseEnd} />
              <Field label="Monthly rent (₹)">
                <input
                  className={inputClass}
                  name="monthlyRent"
                  type="number"
                  min={0}
                  step="any"
                  value={monthlyRent}
                  onChange={(event) => setMonthlyRent(event.target.value)}
                  aria-invalid={Boolean(state.errors?.monthlyRent)}
                />
                {state.errors?.monthlyRent && <FieldError message={state.errors.monthlyRent} />}
              </Field>
              <TenantInput label="Bill rent on day" name="rentBillingDay" type="number" value={tenant?.rentBillingDay ?? 1} error={state.errors?.rentBillingDay} />
              <TenantInput label="Security deposit" name="securityDeposit" type="number" value={tenant?.securityDeposit} error={state.errors?.securityDeposit} step="any" />
              <TenantInput label="Lock-in (months)" name="lockInMonths" type="number" value={tenant?.lockInMonths} error={state.errors?.lockInMonths} />
              <TenantInput label="Notice period (months)" name="noticePeriodMonths" type="number" value={tenant?.noticePeriodMonths} error={state.errors?.noticePeriodMonths} />
              <TenantInput label="Opening outstanding balance" name="openingBalance" type="number" value={tenant?.openingBalance ?? 0} error={state.errors?.openingBalance} step="any" />
              <TenantInput label="Credit balance" name="creditBalance" type="number" value={tenant?.creditBalance ?? 0} error={state.errors?.creditBalance} step="any" />
            </div>
          </section>

          <section className="space-y-4 border-t border-[#eff0f4] pt-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b91a0]">Rent bill taxes</p>
              <p className="mt-1.5 text-xs leading-5 text-[#858b9a]">
                Choose these per tenant. TDS is calculated on the GST-inclusive invoice total.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e3e5ec] bg-[#fafafd] p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-[#4d5362]">
                  <input
                    className="size-4 accent-[#5555c7]"
                    type="checkbox"
                    name="gstEnabled"
                    checked={gstEnabled}
                    onChange={(event) => setGstEnabled(event.target.checked)}
                  />
                  Add GST to rent bills
                </label>
                {gstEnabled && (
                  <div className="mt-3">
                    <Field label="GST rate (%)">
                      <input
                        className={inputClass}
                        name="gstRate"
                        type="number"
                        min={0.01}
                        max={100}
                        step="any"
                        value={gstRate}
                        onChange={(event) => setGstRate(event.target.value)}
                        aria-invalid={Boolean(state.errors?.gstRate)}
                      />
                      {state.errors?.gstRate && <FieldError message={state.errors.gstRate} />}
                    </Field>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-[#e3e5ec] bg-[#fafafd] p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-[#4d5362]">
                  <input
                    className="size-4 accent-[#5555c7]"
                    type="checkbox"
                    name="tdsEnabled"
                    checked={tdsEnabled}
                    onChange={(event) => setTdsEnabled(event.target.checked)}
                  />
                  Tenant deducts TDS
                </label>
                {tdsEnabled && (
                  <div className="mt-3">
                    <Field label="TDS rate (%)">
                      <input
                        className={inputClass}
                        name="tdsRate"
                        type="number"
                        min={0.01}
                        max={100}
                        step="any"
                        value={tdsRate}
                        onChange={(event) => setTdsRate(event.target.value)}
                        aria-invalid={Boolean(state.errors?.tdsRate)}
                      />
                      {state.errors?.tdsRate && <FieldError message={state.errors.tdsRate} />}
                    </Field>
                  </div>
                )}
              </div>
            </div>
            {baseRent > 0 && (
              <div className="rounded-xl border border-[#dfe3f4] bg-[#f6f7fd] px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#777e91]">Monthly bill preview</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#606779]">
                  <span>Rent {formatCurrency(baseRent)}</span>
                  {gstEnabled && <span>+ GST {formatCurrency(previewGst)}</span>}
                  {tdsEnabled && <span>− TDS {formatCurrency(previewTds)}</span>}
                  <span className="font-extrabold text-[#3f4660]">= {formatCurrency(previewPayable)} payable</span>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-[#eff0f4] pt-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b91a0]">Scheduled rent increase</p>
              <p className="mt-1.5 text-xs leading-5 text-[#858b9a]">
                Example: increase the rent by 5% every 12 months, with the next increase on 1 April 2027.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TenantInput label="Rent increase (%)" name="rentEscalationPct" type="number" value={tenant?.rentEscalationPct} error={state.errors?.rentEscalationPct} step="any" />
              <TenantInput label="Increase rent every (months)" name="rentEscalationMonths" type="number" value={tenant?.rentEscalationMonths} error={state.errors?.rentEscalationMonths} />
              <TenantInput label="Next rent increase date" name="nextEscalationDate" type="date" value={tenant?.nextEscalationDate} error={state.errors?.nextEscalationDate} />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8b91a0]">Lease document</p>
            <Field label="Lease document URL">
              <input className={inputClass} name="leaseDocUrl" type="url" defaultValue={tenant?.leaseDocUrl} aria-invalid={Boolean(state.errors?.leaseDocUrl)} placeholder="https://..." />
              {state.errors?.leaseDocUrl && <FieldError message={state.errors.leaseDocUrl} />}
            </Field>
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-[#e3eee9] bg-[#f3faf7] px-4 py-3 text-sm font-semibold text-[#497365]">
            <input className="size-4 accent-[#5555c7]" type="checkbox" name="isActive" defaultChecked={tenant?.isActive ?? true} />
            Active tenant (marks the unit occupied)
          </label>

          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending || !units.length}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Saving..." : editing ? "Save changes" : "Add tenant"}
            </Button>
          </div>
          {!units.length && <p className="text-right text-xs text-[#c65c4d]">Add a property unit before creating a tenant.</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TenantInput({
  label,
  name,
  type,
  value,
  error,
  step,
}: {
  label: string;
  name: string;
  type: "date" | "number";
  value?: string | number | null;
  error?: string;
  step?: string;
}) {
  return (
    <Field label={label}>
      <input className={inputClass} name={name} type={type} min={type === "number" ? 0 : undefined} step={step} defaultValue={value ?? ""} aria-invalid={Boolean(error)} />
      {error && <FieldError message={error} />}
    </Field>
  );
}
