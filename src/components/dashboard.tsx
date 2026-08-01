"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useActionState, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  Download,
  Ellipsis,
  Eye,
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
import { BhadaLogo } from "@/components/brand-logo";
import { DatePickerInput, FormSelect } from "@/components/ui/form-controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { BillDocument, BillIssuer } from "@/components/bill-document";
import type { ProfileValues } from "@/app/dashboard/profile/profile-form";
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
import { authClient } from "@/lib/auth-client";
import type { IncomeOverviewPoint } from "@/lib/dashboard-analytics";
import type { PaymentRecord } from "@/lib/payments";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { formatBillingMonth, type FinancialYearOption } from "@/lib/financial-year";
import type { PropertyRecord, UnitRecord, UnitStatus } from "@/lib/properties";
import type { TenantRecord } from "@/lib/tenants";
import type { TenantAnalytics } from "@/lib/tenant-analytics";
import type { NotificationItem } from "@/lib/notifications";
import { FREE_PLAN, PORTFOLIO_PLAN } from "@/lib/plans";
import { NotificationCenter } from "@/components/notification-center";
import { PortfolioCheckoutButton } from "@/components/portfolio-checkout-button";
import type { SubscriptionReceipt } from "@/lib/subscription-receipts";
import { cn, formatCurrency } from "@/lib/utils";
import styles from "./dashboard.module.css";

const LineChart = dynamic(() => import("@/components/ui/line-chart").then((module) => module.LineChart));
const BillDocumentDialog = dynamic(
  () => import("@/components/bill-document").then((module) => module.BillDocumentDialog),
);
const TenantProfileDialog = dynamic(
  () => import("@/components/tenant-profile-dialog").then((module) => module.TenantProfileDialog),
);
const ProfileForm = dynamic(
  () => import("@/app/dashboard/profile/profile-form").then((module) => module.ProfileForm),
);

type DashboardSection = "Overview" | "Properties" | "Tenants" | "Payments" | "Profile" | "Help center";

const nav: { label: Exclude<DashboardSection, "Profile" | "Help center">; href: string; icon: typeof Home }[] = [
  { label: "Overview", href: "/dashboard", icon: Home },
  { label: "Properties", href: "/dashboard?section=Properties", icon: Building2 },
  { label: "Tenants", href: "/dashboard?section=Tenants", icon: Users },
  { label: "Payments", href: "/dashboard?section=Payments", icon: CreditCard },
];

const sectionHrefs: Record<DashboardSection, string> = {
  Overview: "/dashboard",
  Properties: "/dashboard?section=Properties",
  Tenants: "/dashboard?section=Tenants",
  Payments: "/dashboard?section=Payments",
  Profile: "/dashboard?section=Profile",
  "Help center": "/dashboard?section=Help%20center",
};

const dashboardSections = new Set<DashboardSection>([
  "Overview",
  "Properties",
  "Tenants",
  "Payments",
  "Profile",
  "Help center",
]);

const helpCenterSections = [
  {
    title: "Getting started",
    description: "Set up Bhada in the right order.",
    icon: Home,
    articles: [
      {
        question: "How do I set up my portfolio?",
        answer:
          "Start in Properties: add a property, then add its units. Next, open Tenants and assign each tenant to an available unit. Once the tenant’s rent and billing details are saved, Bhada can prepare the portfolio’s rent view.",
      },
      {
        question: "What does the Overview show?",
        answer:
          "Overview summarizes billed rent, collections, pending and overdue amounts, active properties, income trends, recent payments, and occupancy. Use the period selector to change the income chart’s time range.",
      },
    ],
  },
  {
    title: "Properties & units",
    description: "Build and maintain your portfolio.",
    icon: Building2,
    articles: [
      {
        question: "How do I add a property and its units?",
        answer:
          "Open Properties and select Add property. Save the property’s name and address, then use Add unit on its card. Each unit can include a number, status, floor, area, and an opening electricity meter reading.",
      },
      {
        question: "How do I update a property or unit?",
        answer:
          "Use the pencil button on a property or unit card to edit it. Deleting a property or unit can also remove related rental history, so review the confirmation carefully before continuing.",
      },
    ],
  },
  {
    title: "Tenants & rent",
    description: "Manage leases and rent settings.",
    icon: Users,
    articles: [
      {
        question: "What should I enter when adding a tenant?",
        answer:
          "Assign an available unit and add the tenant’s contact, lease, monthly rent, billing day, due day, deposit, and opening balance details. You can also configure GST, TDS, rent escalation, and a lease document link when applicable.",
      },
      {
        question: "How are rent bills calculated?",
        answer:
          "Bhada uses the tenant’s monthly rent and billing schedule. If enabled, GST is added and TDS is deducted using that tenant’s saved rates. Opening balances and earlier unpaid amounts remain visible in the tenant’s balance.",
      },
      {
        question: "Where can I review a tenant’s history?",
        answer:
          "Open Tenants and select a tenant to see rent and electricity totals, payment history, pending balances, lease details, and collection performance for the selected financial year.",
      },
    ],
  },
  {
    title: "Payments & receipts",
    description: "Record collections and track balances.",
    icon: CreditCard,
    articles: [
      {
        question: "How do I record a payment?",
        answer:
          "Select Record payment, choose the tenant, and enter the payment date, method, amount, and optional reference. Use lump-sum allocation for a single total or itemized allocation to apply amounts to specific rent or electricity charges.",
      },
      {
        question: "What happens with partial or extra payments?",
        answer:
          "A partial payment reduces the tenant’s balance while the remainder stays pending. When recorded payments exceed billed charges, Bhada shows the account as overpaid so the credit remains visible.",
      },
      {
        question: "Can I download or share a bill?",
        answer:
          "Yes. In Payments, open a rent or electricity bill to preview it, then choose Download PDF or Share. If sharing is unavailable on the device, Bhada downloads the PDF instead.",
      },
    ],
  },
  {
    title: "Electricity billing",
    description: "Turn meter readings into tenant bills.",
    icon: Gauge,
    articles: [
      {
        question: "How do I create an electricity bill?",
        answer:
          "Open Payments and select Add electricity bill. Choose the property and unit, billing month, current meter reading, rate per unit, and due date. Bhada uses the previous reading to calculate consumption and the bill amount.",
      },
      {
        question: "Why can’t I add another bill for the same month?",
        answer:
          "Each unit can have only one electricity bill per billing month. Check the existing electricity bills in Payments before trying again, and confirm that the selected month and unit are correct.",
      },
    ],
  },
  {
    title: "Account & notifications",
    description: "Keep business details and alerts current.",
    icon: Settings,
    articles: [
      {
        question: "Where do I update my billing identity?",
        answer:
          "Open Settings to update the landlord or business details used across the account and on generated bills. Save the form before returning to the dashboard.",
      },
      {
        question: "What appears in notifications?",
        answer:
          "Notifications highlight rent and electricity amounts that are due or overdue, upcoming lease expiries, and scheduled rent increases. Marking an item as read removes it from the unread list.",
      },
      {
        question: "How do financial years work?",
        answer:
          "Bhada groups billing and payment records into April–March financial years. Use the Financial year selector in Payments to load the period you want to review.",
      },
    ],
  },
] as const;

const statusStyles: Record<string, string> = {
  Paid: "border border-[#6f927f]/40 bg-[#6f927f]/10 text-[#9bc4ab]",
  Pending: "border border-[#e4c77a]/40 bg-[#e4c77a]/10 text-[#e4c77a]",
  Overpaid: "border border-[#9aa9c4]/40 bg-[#9aa9c4]/10 text-[#b8c5dd]",
  Overdue: "border border-[#c96a4e]/40 bg-[#c96a4e]/10 text-[#df8a70]",
  Upcoming: "border border-white/15 bg-white/5 text-white/60",
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
  incomeOverview,
  notifications,
  subscriptionReceipts,
  subscription,
}: {
  user: DashboardUser;
  initialSection?: DashboardSection;
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
  incomeOverview: IncomeOverviewPoint[];
  notifications: NotificationItem[];
  subscriptionReceipts: SubscriptionReceipt[];
  subscription: {
    active: boolean;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
}) {
  const [active, setActive] = useState<DashboardSection>(initialSection);
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
  const [focusedPaymentId, setFocusedPaymentId] = useState<string | null>(null);
  const [focusedSubscriptionReceiptId, setFocusedSubscriptionReceiptId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [period, setPeriod] = useState("This year");
  const deferredSearch = useDeferredValue(search);
  const totalUnitCount = properties.reduce(
    (total, property) => total + property.units.length,
    0,
  );
  const limits = subscription.active ? PORTFOLIO_PLAN : FREE_PLAN;

  const visiblePayments = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter((payment) =>
      `${payment.tenant} ${payment.property} ${payment.status} ${payment.receiptNumber} ${payment.method} ${payment.summary} ${payment.date}`
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearch, payments]);
  const visibleProperties = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter((item) =>
      `${item.name} ${item.address} ${item.city} ${item.state} ${item.postalCode} ${item.units
        .map((unit) => `${unit.unitNumber} ${unit.tenant?.name ?? ""}`)
        .join(" ")}`
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearch, properties]);
  const visibleTenants = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter((item) =>
      `${item.name} ${item.email} ${item.phone} ${item.propertyName} ${item.unitNumber}`
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearch, tenants]);
  const searchResults = useMemo(
    () => ({
      properties: visibleProperties.slice(0, 4),
      tenants: visibleTenants.slice(0, 4),
      payments: visiblePayments.slice(0, 4),
    }),
    [visiblePayments, visibleProperties, visibleTenants],
  );
  const searchQuery = search.trim();
  const searchResultCount =
    searchResults.properties.length +
    searchResults.tenants.length +
    searchResults.payments.length;

  useEffect(() => {
    function syncSectionFromHistory() {
      const section = new URLSearchParams(window.location.search).get("section");
      setActive(
        section && dashboardSections.has(section as DashboardSection)
          ? (section as DashboardSection)
          : "Overview",
      );
      setSidebarOpen(false);
    }

    window.addEventListener("popstate", syncSectionFromHistory);
    return () => window.removeEventListener("popstate", syncSectionFromHistory);
  }, []);

  useEffect(() => {
    // Warm the two split modal chunks after the dashboard becomes interactive,
    // so their first click is instant without delaying the initial screen.
    const timer = window.setTimeout(() => {
      void Promise.all([
        import("@/components/bill-document"),
        import("@/components/tenant-profile-dialog"),
      ]);
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (active !== "Payments" || !focusedPaymentId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("notification-payment-target")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, focusedPaymentId]);

  function navigateToSection(section: DashboardSection) {
    setActive(section);
    setSidebarOpen(false);
    const href = sectionHrefs[section];
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history.pushState(null, "", href);
    }
  }

  function openSectionLink(event: React.MouseEvent<HTMLAnchorElement>, section: DashboardSection) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigateToSection(section);
  }

  function openNotification(notification: NotificationItem) {
    setSearch("");
    setFocusedPaymentId(null);
    setFocusedSubscriptionReceiptId(null);
    navigateToSection(notification.section);

    switch (notification.target.type) {
      case "payment":
        setFocusedPaymentId(notification.target.paymentId);
        break;
      case "rent_bill": {
        const { billId } = notification.target;
        const bill = rentBilling.bills.find((item) => item.id === billId);
        if (bill) {
          setBillDocument({
            kind: "rent",
            bill,
            tenant: tenants.find((item) => item.id === bill.tenantId) ?? null,
          });
        }
        break;
      }
      case "electricity_bill": {
        const { billId } = notification.target;
        const bill = electricityBills.find((item) => item.id === billId);
        if (bill) {
          setBillDocument({
            kind: "electricity",
            bill,
            tenant: tenants.find((item) => item.id === bill.tenantId) ?? null,
          });
        }
        break;
      }
      case "tenant": {
        const { tenantId } = notification.target;
        const renter = tenants.find((item) => item.id === tenantId);
        if (renter) setProfileTenant(renter);
        break;
      }
      case "subscription_receipt":
        setFocusedSubscriptionReceiptId(notification.target.paymentId);
        break;
    }
  }

  function openProperty(propertyToEdit: PropertyRecord | null = null) {
    if (!propertyToEdit && properties.length >= limits.propertyLimit) {
      showPlanLimit(
        `Your ${limits.name} plan includes ${limits.propertyLimit} ${limits.propertyLimit === 1 ? "property" : "properties"}.`,
      );
      return;
    }
    setEditingProperty(propertyToEdit);
    setPropertyOpen(true);
  }

  function openUnit(property: PropertyRecord, unit: UnitRecord | null = null) {
    if (!unit && totalUnitCount >= limits.unitLimit) {
      showPlanLimit(
        `Your ${limits.name} plan includes ${limits.unitLimit} units.`,
      );
      return;
    }
    setUnitEditor({ property, unit });
  }

  function showPlanLimit(message: string) {
    toast(message, {
      description: `Portfolio supports up to ${PORTFOLIO_PLAN.propertyLimit} properties and ${PORTFOLIO_PLAN.unitLimit} units for ₹${PORTFOLIO_PLAN.monthlyPrice}/month.`,
      action: {
        label: "View plans",
        onClick: () => window.location.assign("/#pricing"),
      },
    });
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
    <div className={cn("dashboard-shell min-h-screen lg:grid lg:grid-cols-[248px_1fr]", styles.shell)}>
      {sidebarOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#171a24]/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r px-4 py-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          styles.sidebar,
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-11 items-center justify-between px-2">
          <Link
            href="/dashboard"
            onClick={(event) => openSectionLink(event, "Overview")}
            className="flex items-center"
          >
            <BhadaLogo
              markClassName="size-9 text-[#edede8]"
              wordmarkClassName="text-[18px] text-[#edede8]"
            />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <nav className="mt-8 space-y-1">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a6b3]">Workspace</p>
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={(event) => openSectionLink(event, item.label)}
              aria-current={active === item.label ? "page" : undefined}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active === item.label
                  ? "bg-[#e4c77a]/10 text-[#e4c77a]"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <item.icon className="size-[18px]" strokeWidth={active === item.label ? 2.3 : 1.9} />
              <span>{item.label}</span>
              {(item.label === "Properties" || item.label === "Tenants") && (
                <span className="ml-auto border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/40">
                  {item.label === "Properties" ? properties.length : tenants.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <nav className="mt-7 space-y-1 border-t border-[#eff0f4] pt-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a6b3]">Manage</p>
          {user.email.trim().toLowerCase() === "feneelp@gmail.com" && (
            <Link
              href="/owner"
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <ChartNoAxesCombined className="size-[18px]" /> Owner analytics
            </Link>
          )}
          <Link
            href="/dashboard?section=Profile"
            onClick={(event) => openSectionLink(event, "Profile")}
            aria-current={active === "Profile" ? "page" : undefined}
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active === "Profile"
                ? "bg-[#e4c77a]/10 text-[#e4c77a]"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <Settings className="size-[18px]" /> Settings
          </Link>
          <Link
            href="/dashboard?section=Help%20center"
            onClick={(event) => openSectionLink(event, "Help center")}
            aria-current={active === "Help center" ? "page" : undefined}
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active === "Help center"
                ? "bg-[#e4c77a]/10 text-[#e4c77a]"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <HelpCircle className="size-[18px]" /> Help center
          </Link>
        </nav>

        <div className="mt-auto border border-[#e4c77a]/25 bg-[#e4c77a]/[0.05] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-[#e4c77a] uppercase">
              <Sparkles className="size-4" /> {limits.name}
            </div>
            <span className="border border-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.08em] text-white/40 uppercase">
              {subscription.active ? "Active" : "Free"}
            </span>
          </div>
          <div className="mt-3 h-1 overflow-hidden bg-white/10">
            <div
              className="h-full bg-[#e4c77a] transition-[width]"
              style={{ width: `${Math.min(100, (totalUnitCount / limits.unitLimit) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-4 text-white/40">
            {totalUnitCount} of {limits.unitLimit} units used · {properties.length} of {limits.propertyLimit} {limits.propertyLimit === 1 ? "property" : "properties"}
          </p>
          {subscription.active ? (
            <p className="mt-3 text-[11px] font-semibold text-[#e4c77a]">
              {subscription.cancelAtPeriodEnd ? "Downgrade scheduled" : "Portfolio billing is active"}
            </p>
          ) : (
            <PortfolioCheckoutButton
              className="mt-3 inline-flex items-center gap-1.5 text-left text-[11px] font-semibold text-[#e4c77a] hover:text-[#f0da9d]"
            />
          )}
        </div>

        <div className="mt-4 flex items-center rounded-xl px-2 py-2">
          <Link
            href="/dashboard?section=Profile"
            onClick={(event) => openSectionLink(event, "Profile")}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c77a]/70"
            aria-label="Open profile settings"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-cover bg-center text-xs font-bold",
                user.image
                  ? "bg-[#272b3a] text-white"
                  : "border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-[#e4c77a]",
              )}
              style={user.image ? { backgroundImage: `url("${user.image.replace(/"/g, "%22")}")` } : undefined}
            >
              {!user.image && initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#edede8]">{user.name}</span>
              <span className="block truncate text-[11px] text-white/35">{user.email}</span>
            </span>
          </Link>
          <button onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-8 place-items-center text-white/35 hover:bg-white/5 hover:text-[#e4c77a]">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-3 sm:h-[72px] sm:gap-3 sm:px-7 lg:px-9", styles.topbar)}>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 lg:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Bhada</p>
            <p className="truncate text-sm font-semibold text-[#edede8]">{active}</p>
          </div>
          <div
            className="relative hidden max-w-[360px] flex-1 sm:block"
            onFocus={() => setSearchOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
            }}
          >
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9aa0af]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchOpen(false);
                  event.currentTarget.blur();
                }
              }}
              placeholder="Search tenants, properties..."
              role="combobox"
              aria-label="Search tenants, properties, and payments"
              aria-expanded={searchOpen && Boolean(searchQuery)}
              aria-controls="dashboard-search-results"
              className="h-10 w-full border border-white/15 bg-white/[0.025] pl-10 pr-4 text-sm text-[#edede8] outline-none transition placeholder:text-white/30 focus:border-[#e4c77a]/60 focus:bg-white/[0.04]"
            />
            {searchOpen && searchQuery && (
              <DashboardSearchResults
                id="dashboard-search-results"
                className="absolute left-0 right-0 top-[calc(100%+10px)]"
                count={searchResultCount}
                results={searchResults}
                onNavigate={(section) => {
                  navigateToSection(section);
                  setSearchOpen(false);
                }}
              />
            )}
          </div>
          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label={searchOpen ? "Close search" : "Search dashboard"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </Button>
            <NotificationCenter
              initialNotifications={notifications}
              onNavigate={openNotification}
            />
            <div
              className="flex h-10 items-center gap-2 border-b border-white/15 px-0.5 sm:gap-2.5"
              aria-label={`${rentBilling.collectionRate}% collected this month, ${formatCurrency(rentBilling.pendingTotal)} pending`}
              title={`${rentBilling.periodLabel}: ${formatCurrency(rentBilling.paidThisMonth)} collected · ${formatCurrency(rentBilling.pendingTotal)} pending`}
            >
              <CircleDollarSign className="size-4 shrink-0 text-[#e4c77a]" />
              <span className="hidden leading-none min-[380px]:block">
                <span className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35 sm:block">
                  This month
                </span>
                <span className="mt-1 block whitespace-nowrap text-xs font-semibold text-[#edede8]">
                  {rentBilling.collectionRate}% collected
                </span>
              </span>
              <span className="hidden md:block">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Pending
                </span>
                <span className="mt-1 block whitespace-nowrap text-xs font-semibold text-[#e4c77a]">
                  {formatCurrency(rentBilling.pendingTotal)}
                </span>
              </span>
            </div>
          </div>
          {searchOpen && (
            <div className={cn("absolute inset-x-0 top-full border-b border-white/10 p-3 sm:hidden", styles.mobileSearch)}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tenants, properties..."
                  aria-label="Search tenants, properties, and payments"
                  className="h-11 w-full border border-white/15 bg-white/[0.025] pl-10 pr-4 text-sm text-[#edede8] outline-none placeholder:text-white/30 focus:border-[#e4c77a]/60"
                />
              </div>
              {searchQuery && (
                <DashboardSearchResults
                  count={searchResultCount}
                  results={searchResults}
                  onNavigate={(section) => {
                    navigateToSection(section);
                    setSearchOpen(false);
                  }}
                  className="mt-2 max-h-[min(58vh,440px)]"
                />
              )}
            </div>
          )}
        </header>

        <div
          key={active}
          className={cn(
            "mx-auto max-w-[1440px] px-3 py-5 pb-28 min-[380px]:px-4 sm:px-7 sm:py-7 sm:pb-8 lg:px-9 lg:py-9",
            styles.content,
            styles.sectionTransition,
          )}
        >
          {active === "Overview" ? (
            <Overview
              period={period}
              setPeriod={setPeriod}
              payments={visiblePayments}
              rentBilling={rentBilling}
              properties={visibleProperties}
              totalProperties={properties.length}
              incomeOverview={incomeOverview}
              onAddProperty={() => openProperty()}
              onViewPayments={() => navigateToSection("Payments")}
              onViewProperties={() => navigateToSection("Properties")}
              firstName={firstName}
            />
          ) : active === "Profile" && profile ? (
            <ProfileForm
              key={focusedSubscriptionReceiptId ?? "profile"}
              email={user.email}
              initialValues={profile}
              subscription={subscription}
              receipts={subscriptionReceipts}
              initialSection={focusedSubscriptionReceiptId ? "receipts" : "business"}
              focusedReceiptId={focusedSubscriptionReceiptId ?? undefined}
            />
          ) : active === "Help center" ? (
            <HelpCenter />
          ) : (
            <SectionView
              section={active}
              payments={visiblePayments}
              focusedPaymentId={focusedPaymentId ?? undefined}
              rentBilling={rentBilling}
              electricityBills={electricityBills}
              financialYearStart={financialYearStart}
              financialYearOptions={financialYearOptions}
              properties={visibleProperties}
              tenants={visibleTenants}
              portfolioActive={subscription.active}
              onAddProperty={() => openProperty()}
              onEditProperty={openProperty}
              onAddUnit={(property) => openUnit(property)}
              onEditUnit={(property, unit) => openUnit(property, unit)}
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

      <nav className={styles.mobileNav} aria-label="Primary navigation">
        {nav.slice(0, 4).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={(event) => openSectionLink(event, item.label)}
            aria-current={active === item.label ? "page" : undefined}
            className={cn(styles.mobileNavItem, active === item.label && styles.mobileNavItemActive)}
          >
            <item.icon className="size-[19px]" strokeWidth={active === item.label ? 2.4 : 1.8} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {paymentOpen && (
        <RecordPaymentDialog
          open
          onOpenChange={setPaymentOpen}
          tenants={tenants}
        />
      )}
      {electricityBillOpen && (
        <ElectricityBillDialog
          open
          onOpenChange={setElectricityBillOpen}
          properties={properties}
        />
      )}
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
      {billDocument && (
        <BillDocumentDialog
          document={billDocument}
          issuer={issuer}
          onClose={() => setBillDocument(null)}
        />
      )}
      {profileTenant && (
        <TenantProfileDialog
          tenant={profileTenant}
          analytics={tenantAnalytics.find((item) => item.tenantId === profileTenant.id) ?? null}
          payments={payments}
          rentBills={rentBilling.bills}
          electricityBills={electricityBills}
          financialYearLabel={rentBilling.financialYearLabel}
          onClose={() => setProfileTenant(null)}
        />
      )}
    </div>
  );
}

function DashboardSearchResults({
  id,
  className,
  count,
  results,
  onNavigate,
}: {
  id?: string;
  className?: string;
  count: number;
  results: {
    properties: PropertyRecord[];
    tenants: TenantRecord[];
    payments: PaymentRecord[];
  };
  onNavigate: (section: "Properties" | "Tenants" | "Payments") => void;
}) {
  return (
    <div
      id={id}
      className={cn(
        "z-50 overflow-y-auto border border-white/10 bg-[#181816] p-2 shadow-[0_18px_55px_rgba(0,0,0,.42)]",
        className,
      )}
    >
      {count ? (
        <>
          {results.properties.length > 0 && (
            <SearchResultGroup label="Properties">
              {results.properties.map((property) => (
                <SearchResultButton
                  key={property.id}
                  icon={Building2}
                  title={property.name}
                  description={[property.address, property.city].filter(Boolean).join(", ") || "Property"}
                  onClick={() => onNavigate("Properties")}
                />
              ))}
            </SearchResultGroup>
          )}
          {results.tenants.length > 0 && (
            <SearchResultGroup label="Tenants">
              {results.tenants.map((tenant) => (
                <SearchResultButton
                  key={tenant.id}
                  icon={Users}
                  title={tenant.name}
                  description={`${tenant.propertyName} · Unit ${tenant.unitNumber}`}
                  onClick={() => onNavigate("Tenants")}
                />
              ))}
            </SearchResultGroup>
          )}
          {results.payments.length > 0 && (
            <SearchResultGroup label="Payments">
              {results.payments.map((payment) => (
                <SearchResultButton
                  key={payment.id}
                  icon={CreditCard}
                  title={payment.tenant}
                  description={`${payment.receiptNumber} · ${formatCurrency(payment.amount)} · ${payment.status}`}
                  onClick={() => onNavigate("Payments")}
                />
              ))}
            </SearchResultGroup>
          )}
        </>
      ) : (
        <div className="px-3 py-7 text-center">
          <p className="text-sm font-semibold text-[#edede8]">No results found</p>
          <p className="mt-1 text-xs text-white/40">Try a name, property, unit, or receipt number.</p>
        </div>
      )}
    </div>
  );
}

function SearchResultGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-1">
      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
        {label}
      </p>
      {children}
    </section>
  );
}

function SearchResultButton({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
    >
      <span className="grid size-8 shrink-0 place-items-center border border-[#e4c77a]/20 bg-[#e4c77a]/[0.07] text-[#e4c77a]">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#edede8]">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-white/40">{description}</span>
      </span>
    </button>
  );
}

function Overview({
  period,
  setPeriod,
  payments: rows,
  rentBilling,
  properties,
  totalProperties,
  incomeOverview,
  onAddProperty,
  onViewPayments,
  onViewProperties,
  firstName,
}: {
  period: string;
  setPeriod: (value: string) => void;
  payments: PaymentRecord[];
  rentBilling: RentBillingSummary;
  properties: PropertyRecord[];
  totalProperties: number;
  incomeOverview: IncomeOverviewPoint[];
  onAddProperty: () => void;
  onViewPayments: () => void;
  onViewProperties: () => void;
  firstName: string;
}) {
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="animate-rise flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-5">
        <div>
          <p className="mb-1 text-xs font-medium text-[#888e9d] sm:text-sm">{todayLabel}</p>
          <h1 className="font-display text-[27px] leading-tight tracking-[-0.045em] text-[#222836] sm:text-[34px]">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 text-[13px] text-[#747b8b] sm:text-sm">Here&apos;s how your portfolio is doing this month.</p>
        </div>
        <Button variant="outline" onClick={onAddProperty} className="w-full sm:w-auto">
          <Plus className="size-4" /> Add property
        </Button>
      </div>

      <div className="animate-rise-delay mt-5 grid grid-cols-2 gap-2 sm:mt-7 sm:gap-4 xl:grid-cols-4">
        <MetricCard icon={WalletCards} label="Billed this month" value={formatCurrency(rentBilling.billedThisMonth)} note={`${rentBilling.periodLabel} rent bills`} trend="up" tone="indigo" />
        <MetricCard icon={CircleDollarSign} label="Collected" value={formatCurrency(rentBilling.paidThisMonth)} note={`${rentBilling.collectionRate}% collection rate`} trend="up" tone="green" />
        <MetricCard icon={CalendarDays} label="Pending rent" value={formatCurrency(rentBilling.pendingTotal)} note={`${rentBilling.overdueCount} overdue bill${rentBilling.overdueCount === 1 ? "" : "s"}`} trend="down" tone="orange" />
        <MetricCard icon={Building2} label="Active properties" value={String(totalProperties)} note="Across your portfolio" trend="up" tone="pink" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)] sm:p-6">
          <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-4">
            <div>
              <h2 className="font-display text-base font-bold tracking-[-0.025em]">Income overview</h2>
              <p className="mt-1 text-xs text-[#8b91a0]">Rent collected across all properties</p>
            </div>
            <FormSelect
              value={period}
              onValueChange={setPeriod}
              className="h-9 w-full rounded-lg border-[#e3e5ec] bg-white px-3 text-xs font-semibold text-[#5f6676] min-[380px]:w-[132px]"
              options={[
                { value: "This year", label: "This year" },
                { value: "Last 6 months", label: "Last 6 months" },
                { value: "This quarter", label: "This quarter" },
              ]}
            />
          </div>
          <IncomeChart period={period} data={incomeOverview} />
        </section>

        <section className="flex h-full flex-col rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-base font-bold tracking-[-0.025em]">{rentBilling.periodLabel} rent</h2>
              <p className="mt-1 text-xs text-[#8b91a0]">Payment collection progress</p>
            </div>
            <button className="grid size-8 place-items-center rounded-lg text-[#8b91a0] hover:bg-[#f3f4f7]">
              <Ellipsis className="size-5" />
            </button>
          </div>
          <div className="mt-6 flex items-center gap-3 sm:mt-7 sm:gap-6">
            <div
              className="relative grid size-[96px] shrink-0 place-items-center rounded-full sm:size-[118px]"
              style={{ background: `conic-gradient(#e4c77a 0 ${rentBilling.collectionRate}%, #2a2a28 ${rentBilling.collectionRate}% 100%)` }}
            >
              <div className="grid size-[72px] place-items-center rounded-full bg-white text-center sm:size-[88px]">
                <div>
                  <p className="font-display text-xl font-extrabold tracking-[-0.04em]">{rentBilling.collectionRate}%</p>
                  <p className="text-[10px] text-[#9298a7]">collected</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <Legend dot="#e4c77a" label="Paid" value={formatCurrency(rentBilling.paidThisMonth)} />
              <Legend dot="#eea05a" label="Pending" value={formatCurrency(rentBilling.pendingThisMonth)} />
              <Legend dot="#ea6f62" label="Overdue" value={formatCurrency(rentBilling.overdueTotal)} />
            </div>
          </div>
          <div className="mt-auto pt-7">
            <Button onClick={onViewPayments} variant="outline" className="w-full">
              View all payments
            </Button>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <PaymentTable rows={rows} onViewAll={onViewPayments} />
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
    indigo: "border border-[#e4c77a]/30 bg-[#e4c77a]/10 text-[#e4c77a]",
    green: "border border-[#7aa18b]/30 bg-[#7aa18b]/10 text-[#9bc4ab]",
    orange: "border border-[#c99162]/30 bg-[#c99162]/10 text-[#dda676]",
    pink: "border border-[#b77f96]/30 bg-[#b77f96]/10 text-[#d29bb2]",
  };
  return (
    <article className="group min-w-0 rounded-[22px] border border-white/80 bg-white p-3.5 shadow-[0_8px_30px_rgba(32,38,55,.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(32,38,55,.075)] sm:p-5">
      <div className="flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl sm:size-10", tones[tone])}>
          <Icon className="size-[17px] sm:size-[19px]" strokeWidth={2.1} />
        </span>
        <button className="hidden text-[#a0a5b2] hover:text-[#666d7d] sm:block">
          <Ellipsis className="size-5" />
        </button>
      </div>
      <p className="mt-4 truncate text-[11px] font-medium text-[#858b9a] sm:mt-5 sm:text-xs">{label}</p>
      <p className="mt-1 truncate font-display text-lg tracking-[-0.045em] text-[#242a38] sm:text-[23px]">{value}</p>
      <p className={cn("mt-2 flex items-start gap-1 text-[10px] font-semibold leading-4 sm:mt-3 sm:text-[11px]", trend === "up" ? "text-[#479078]" : "text-[#c06b58]")}>
        {trend === "up" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
        {note}
      </p>
    </article>
  );
}

function IncomeChart({
  period,
  data,
}: {
  period: string;
  data: IncomeOverviewPoint[];
}) {
  const count = period === "This quarter" ? 3 : period === "Last 6 months" ? 6 : 12;
  const visibleData = data.slice(-count);
  return <LineChart key={period} data={visibleData} />;
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

function PaymentTable({
  rows,
  onViewAll,
  focusedPaymentId,
}: {
  rows: PaymentRecord[];
  onViewAll?: () => void;
  focusedPaymentId?: string;
}) {
  const focusedPayment = rows.find((payment) => payment.id === focusedPaymentId);
  const displayedRows = focusedPayment
    ? [focusedPayment, ...rows.filter((payment) => payment.id !== focusedPaymentId).slice(0, 7)]
    : rows.slice(0, 8);

  return (
    <section
      id={focusedPayment ? "notification-payment-target" : undefined}
      className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]"
    >
      <div className="flex items-center justify-between p-5 pb-4 sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Recent payments</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Latest activity from your tenants</p>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-bold text-[#5b5bd6] hover:text-[#4646b8]">
            View all
          </button>
        )}
      </div>
      <div className="divide-y divide-white/[0.075] border-t border-white/10 sm:hidden">
        {rows.length ? (
          displayedRows.map((payment) => (
            <div
              key={payment.id}
              className={cn(
                "p-4",
                payment.id === focusedPaymentId && "bg-[#e4c77a]/[0.09] ring-1 ring-inset ring-[#e4c77a]/35",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-[10px] font-extrabold text-[#e4c77a]">
                  {payment.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#343a48]">{payment.tenant}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#989eac]">{payment.property} · {payment.summary}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#343a48]">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[#7e8595]">{payment.date}</p>
                    <span className={cn("inline-flex px-2.5 py-1 text-[10px] font-bold", statusStyles[payment.status])}>
                      {payment.status}
                    </span>
                  </div>
                  {payment.status !== "Paid" && (
                    <p className="mt-2 text-right text-[10px] font-semibold text-[#b66a45]">
                      Balance {formatCurrency(payment.balance)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="px-5 py-10 text-center text-sm text-[#8b91a0]">No payments match your search.</p>
        )}
      </div>
      <div className="hidden overflow-x-auto sm:block">
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
              displayedRows.map((payment) => (
                <tr
                  key={payment.id}
                  className={cn(
                    "border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]",
                    payment.id === focusedPaymentId && "bg-[#fff9e9] ring-1 ring-inset ring-[#e4c77a]/50",
                  )}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-[10px] font-extrabold text-[#e4c77a]">
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

const propertyColors = [
  { backgroundColor: "#eeeefd", color: "#5b5bd6", borderColor: "#ddddef" },
  { backgroundColor: "#e6f6f2", color: "#168b79", borderColor: "#d1ebe4" },
  { backgroundColor: "#fff1df", color: "#bd7335", borderColor: "#f4e1c9" },
  { backgroundColor: "#f9e9f0", color: "#a85f7c", borderColor: "#edd6e0" },
  { backgroundColor: "#e8f0fb", color: "#4776bd", borderColor: "#d4e1f3" },
] as const;

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
      <div className="mt-3 divide-y divide-white/[0.075]">
        {properties.slice(0, 3).map((property) => (
          <div key={property.id} className="flex items-center gap-3 py-3.5">
            <span
              className="grid size-10 place-items-center rounded-xl border"
              style={propertyColor(property.id)}
            >
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
  focusedPaymentId,
  rentBilling,
  electricityBills,
  financialYearStart,
  financialYearOptions,
  properties,
  tenants,
  portfolioActive,
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
  focusedPaymentId?: string;
  rentBilling: RentBillingSummary;
  electricityBills: ElectricityBillRecord[];
  financialYearStart: number;
  financialYearOptions: FinancialYearOption[];
  properties: PropertyRecord[];
  tenants: TenantRecord[];
  portfolioActive: boolean;
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
  };
  function exportSection() {
    const params = new URLSearchParams({ section });
    if (section === "Payments") params.set("fy", String(financialYearStart));
    const anchor = document.createElement("a");
    anchor.href = `/api/export?${params.toString()}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  const hasExportData =
    section === "Properties"
      ? properties.length > 0
      : section === "Tenants"
        ? tenants.length > 0
        : rentBilling.bills.length > 0 || electricityBills.length > 0 || rows.length > 0;
  const canExport = portfolioActive && hasExportData;

  return (
    <div className="animate-rise">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-[#8a909f] sm:text-sm">Portfolio</p>
          <h1 className="mt-1 font-display text-[29px] font-extrabold tracking-[-0.045em] sm:text-[34px]">{section}</h1>
          <p className="mt-1 text-[13px] text-[#747b8b] sm:text-sm">{descriptions[section]}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={exportSection}
            disabled={!canExport}
            title={!portfolioActive ? "CSV export is included with Portfolio." : undefined}
          >
            <Download className="size-4" /> Export CSV
          </Button>
          {section === "Payments" && (
            <Button variant="outline" onClick={onAddElectricityBill}>
              <Plus className="size-4" /> Add electricity bill
            </Button>
          )}
          <Button
            onClick={section === "Properties" ? onAddProperty : section === "Tenants" ? onAddTenant : onRecordPayment}
            className="col-span-2 sm:col-auto"
          >
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
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[20px] border border-[#e7e9ef] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-xs font-bold text-[#4d5362]">Financial year</p>
                <p className="mt-1 text-[11px] text-[#8b91a0]">Only the selected April–March period is loaded.</p>
              </div>
              <FormSelect
                className="h-10 w-full rounded-xl border border-[#dfe2e9] bg-[#fafafd] px-3 text-sm font-semibold outline-none focus:border-[#aaaaf0] sm:w-44"
                value={String(financialYearStart)}
                onValueChange={(value) => {
                  window.location.assign(`/dashboard?section=Payments&fy=${value}`);
                }}
                options={financialYearOptions.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
              />
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
            <PaymentTable rows={rows} focusedPaymentId={focusedPaymentId} />
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
      <div className="divide-y divide-white/[0.075] border-t border-white/10 sm:hidden">
        {visibleBills.length ? visibleBills.map((bill) => (
          <article key={bill.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#343a48]">{bill.billNumber}</p>
                <p className="mt-1 truncate text-[11px] text-[#7e8595]">
                  {bill.tenantName} · {formatBillingMonth(bill.billingPeriod)}
                </p>
              </div>
              <span className={cn(
                "inline-flex shrink-0 px-2.5 py-1 text-[10px] font-bold",
                bill.status === "Paid"
                  ? statusStyles.Paid
                  : bill.status === "Overdue"
                    ? statusStyles.Overdue
                    : statusStyles.Upcoming,
              )}>
                {bill.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/[0.075] py-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Payable</p>
                <p className="mt-1 text-sm font-bold text-[#343a48]">{formatCurrency(bill.amount)}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Pending</p>
                <p className="mt-1 text-sm font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#7e8595]">Due {bill.dueDate}</p>
              <button
                onClick={() => onViewBill(bill)}
                className="inline-flex h-9 items-center gap-1.5 border border-[#dfe2e9] px-3 text-[11px] font-bold text-[#5555c7]"
              >
                <Eye className="size-3.5" /> View bill
              </button>
            </div>
          </article>
        )) : (
          <p className="px-5 py-10 text-center text-sm text-[#8b91a0]">
            {billSearch ? "No rent bill matches that bill number." : `No rent bills in ${financialYearLabel}.`}
          </p>
        )}
      </div>
      <div className="hidden overflow-x-auto sm:block">
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
      <div className="divide-y divide-white/[0.075] border-t border-white/10 sm:hidden">
        {visibleBills.length ? visibleBills.map((bill) => (
          <article key={bill.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#343a48]">{bill.billNumber}</p>
                <p className="mt-1 truncate text-[11px] text-[#7e8595]">
                  {bill.propertyName} · Unit {bill.unitNumber}
                </p>
              </div>
              <span className={cn(
                "inline-flex shrink-0 px-2.5 py-1 text-[10px] font-bold",
                bill.status === "Paid"
                  ? statusStyles.Paid
                  : bill.status === "Overdue"
                    ? statusStyles.Overdue
                    : statusStyles.Upcoming,
              )}>
                {bill.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/[0.075] py-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Amount</p>
                <p className="mt-1 text-sm font-bold text-[#343a48]">{formatCurrency(bill.amount)}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Pending</p>
                <p className="mt-1 text-sm font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Meter reading</p>
                <p className="mt-1 text-[11px] text-[#7e8595]">
                  {bill.previousReading} → {bill.currentReading} · {bill.unitsConsumed} units
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#7e8595]">Due {bill.dueDate}</p>
              <button
                onClick={() => onViewBill(bill)}
                className="inline-flex h-9 items-center gap-1.5 border border-[#dfe2e9] px-3 text-[11px] font-bold text-[#5555c7]"
              >
                <Eye className="size-3.5" /> View bill
              </button>
            </div>
          </article>
        )) : (
          <p className="px-5 py-10 text-center text-sm text-[#8b91a0]">
            {billSearch ? "No electricity bill matches that bill number." : `No electricity bills in ${financialYearLabel}.`}
          </p>
        )}
      </div>
      <div className="hidden overflow-x-auto sm:block">
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
      <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-[#e4c77a]"><Users className="size-6" /></span>
          <h2 className="mt-5 font-display text-lg font-bold text-white/75">No tenants found</h2>
          <p className="mt-2 text-sm text-white/40">Add a tenant or clear your search to see tenant records.</p>
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
    <article className="rounded-[20px] border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-sm font-extrabold text-[#e4c77a]">
          {item.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-lg font-bold text-white/75">{item.name}</h2>
            <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold", item.isActive ? "border-[#7aa18b]/30 bg-[#7aa18b]/10 text-[#9bc4ab]" : "border-white/10 bg-white/[0.04] text-white/45")}>
              {item.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-white/40">
            {item.propertyName} · Unit {item.unitNumber}
          </p>
        </div>
        <button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} className="grid size-8 place-items-center rounded-lg text-white/35 hover:bg-white/[0.05] hover:text-[#e4c77a]">
          <Pencil className="size-4" />
        </button>
        <button type="button" onClick={remove} disabled={deleting} aria-label={`Delete ${item.name}`} className="grid size-8 place-items-center rounded-lg text-[#c96a4e]/55 hover:bg-[#c96a4e]/10 hover:text-[#c96a4e] disabled:opacity-50">
          {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>
      <div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-4 text-xs text-white/40 sm:grid-cols-2">
        <p className="truncate"><span className="font-bold text-white/60">Email:</span> {item.email || "Not provided"}</p>
        <p className="truncate"><span className="font-bold text-white/60">Phone:</span> {item.phone || "Not provided"}</p>
        <p><span className="font-bold text-white/60">Lease:</span> {item.leaseStart || "—"} to {item.leaseEnd || "—"}</p>
        <p><span className="font-bold text-white/60">Monthly rent:</span> {item.monthlyRent === null ? "—" : formatInr(item.monthlyRent)}</p>
        <p><span className="font-bold text-white/60">Billing:</span> Day {item.rentBillingDay} · due day {item.rentDueDay}</p>
        <p>
          <span className="font-bold text-white/60">Tax on rent:</span>{" "}
          {item.gstEnabled
            ? `${item.gstRate}% GST on ${item.gstTaxablePercent}% of rent`
            : "No GST"}
          {" · "}
          {item.tdsEnabled ? `${item.tdsRate}% TDS` : "No TDS"}
        </p>
        <p><span className="font-bold text-white/60">Opening balance:</span> {formatCurrency(item.openingBalance)}</p>
        <p><span className="font-bold text-white/60">Deposit:</span> {item.securityDeposit === null ? "—" : formatInr(item.securityDeposit)}</p>
      </div>
      <button
        type="button"
        onClick={() => onView(item)}
        className="group mt-5 flex h-11 w-full items-center justify-between border border-white/10 bg-white/[0.018] px-4 text-xs font-semibold tracking-[0.01em] text-white/55 transition-[border-color,background-color,color] hover:border-[#e4c77a]/55 hover:bg-[#e4c77a]/[0.06] hover:text-[#e4c77a]"
      >
        <span className="flex items-center gap-2.5">
          <Eye className="size-4 text-white/40 transition-colors group-hover:text-[#e4c77a]" />
          View analytics
        </span>
        <ArrowUpRight className="size-4 text-white/25 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#e4c77a]" />
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
        <span
          className="grid size-11 place-items-center rounded-xl border"
          style={propertyColor(property.id)}
        >
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

function HelpCenter() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openArticle, setOpenArticle] = useState<string | null>(
    helpCenterSections[0].articles[0].question,
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleSections = helpCenterSections
    .filter((section) => category === "All" || section.title === category)
    .map((section) => ({
      ...section,
      articles: section.articles.filter((article) =>
        `${article.question} ${article.answer}`.toLowerCase().includes(normalizedQuery),
      ),
    }))
    .filter((section) => section.articles.length > 0);
  const resultCount = visibleSections.reduce((total, section) => total + section.articles.length, 0);

  return (
    <div className="animate-rise">
      <div className="border-b border-white/10 pb-8">
        <p className="text-sm text-[#8a909f]">Support</p>
        <h1 className="mt-1 font-display text-[34px] font-extrabold tracking-[-0.045em]">Help center</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#747b8b]">
          Practical answers for setting up your portfolio, billing tenants, and tracking collections.
        </p>
        <div className="relative mt-6 max-w-2xl">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9aa0af]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help articles..."
            aria-label="Search help articles"
            className="h-12 w-full border border-white/15 bg-white/[0.025] pl-11 pr-4 text-sm text-[#edede8] outline-none transition placeholder:text-white/30 focus:border-[#e4c77a]/60"
          />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2" aria-label="Help categories">
        {["All", ...helpCenterSections.map((section) => section.title)].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "border px-3.5 py-2 text-xs font-semibold transition",
              category === item
                ? "border-[#e4c77a]/60 bg-[#e4c77a]/10 text-[#e4c77a]"
                : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/75",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden space-y-3 lg:block">
          {helpCenterSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setCategory(section.title)}
                className="flex w-full items-start gap-3 border border-white/10 p-4 text-left transition hover:border-[#e4c77a]/35 hover:bg-[#e4c77a]/[0.035]"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-[#e4c77a]" />
                <span>
                  <span className="block text-sm font-semibold text-[#edede8]">{section.title}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-white/35">{section.description}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <div>
          <p className="mb-3 text-xs font-semibold text-white/35">
            {resultCount} {resultCount === 1 ? "article" : "articles"}
          </p>
          {visibleSections.length ? (
            <div className="space-y-7">
              {visibleSections.map((section) => (
                <section key={section.title} className="border border-white/10 bg-[#171717] px-5 sm:px-6">
                  <div className="border-b border-white/10 py-5">
                    <h2 className="font-display text-lg font-bold">{section.title}</h2>
                    <p className="mt-1 text-xs text-white/35">{section.description}</p>
                  </div>
                  {section.articles.map((article) => {
                    const isOpen = openArticle === article.question;
                    const answerId = `help-${article.question.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                    return (
                      <div key={article.question} className="border-b border-white/10 last:border-b-0">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={answerId}
                          onClick={() => setOpenArticle(isOpen ? null : article.question)}
                          className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-[#edede8] outline-none transition hover:text-[#e4c77a] focus-visible:text-[#e4c77a]"
                        >
                          {article.question}
                          <ChevronDown className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                          <p id={answerId} className="max-w-3xl pb-5 text-sm leading-6 text-white/50">
                            {article.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-white/15 px-6 py-14 text-center">
              <HelpCircle className="mx-auto size-6 text-[#e4c77a]" />
              <h2 className="mt-4 font-display text-lg font-bold">No articles found</h2>
              <p className="mt-2 text-sm text-white/40">Try a different search or choose another category.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="mt-5 text-sm font-semibold text-[#e4c77a] hover:text-[#f0da9d]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-white/65">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "h-11 w-full rounded-none border border-white/[0.09] bg-white/[0.018] px-3.5 text-sm text-[#edede8]/85 outline-none transition-[border-color,background-color,color] placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.028] focus:ring-0 aria-invalid:border-[#c96a4e]/55";

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
            <FormSelect
              required
              className={inputClass}
              name="unitId"
              value={selectedUnitId}
              onValueChange={(value) => {
                setSelectedUnitId(value);
                setCurrentReading("");
              }}
              invalid={Boolean(state.errors?.unitId)}
              placeholder="Select a unit"
              options={units.map(({ property, unit }) => ({
                value: unit.id,
                label: `${property.name} · Unit ${unit.unitNumber}${unit.tenant ? ` · ${unit.tenant.name}` : " · Vacant"}`,
              }))}
            />
            {state.errors?.unitId && <FieldError message={state.errors.unitId} />}
            {selectedUnit && previousReading === null && (
              <FieldError message="Edit this unit and set its opening meter reading first." />
            )}
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Billing month">
              <DatePickerInput
                name="billingPeriod"
                defaultValue={today.slice(0, 7)}
                className={inputClass}
                invalid={Boolean(state.errors?.billingPeriod)}
                required
                monthOnly
                placeholder="Pick a billing month"
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
              <DatePickerInput
                name="dueDate"
                defaultValue={today}
                className={inputClass}
                invalid={Boolean(state.errors?.dueDate)}
                required
              />
              {state.errors?.dueDate && <FieldError message={state.errors.dueDate} />}
            </Field>
            <Field label="Note">
              <input className={inputClass} name="note" placeholder="Meter bill reference, optional" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3 border border-white/[0.08] bg-white/[0.025] px-4 py-3.5 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">Previous</p>
              <p className="mt-1 text-sm font-extrabold text-[#e4c77a]">{previousReading ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">Units used</p>
              <p className="mt-1 text-sm font-extrabold text-[#e4c77a]">{unitsConsumed.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">Bill amount</p>
              <p className="mt-1 text-sm font-extrabold text-[#e4c77a]">{formatCurrency(calculatedAmount)}</p>
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
            <FormSelect
              required
              className={inputClass}
              name="tenantId"
              defaultValue=""
              invalid={Boolean(state.errors?.tenantId)}
              placeholder="Select a tenant"
              options={tenants.map((item) => ({
                value: item.id,
                label: `${item.name} — ${item.propertyName} · Unit ${item.unitNumber}`,
              }))}
            />
            {state.errors?.tenantId && <FieldError message={state.errors.tenantId} />}
          </Field>

          <div>
            <p className="mb-2 text-xs font-semibold text-white/65">Allocation</p>
            <div className="grid grid-cols-2 border border-white/[0.08] bg-white/[0.02] p-1">
              {([
                ["lump_sum", "Lump sum"],
                ["bill_wise", "Bill wise"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeMode(value)}
                  className={cn(
                    "h-9 text-xs font-bold transition-colors",
                    mode === value ? "bg-[#e4c77a] text-[#111111]" : "text-white/40 hover:text-white/65",
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
                  <p className="text-xs font-semibold text-white/65">Bills paid</p>
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
                <div key={allocation.id} className="border border-white/[0.09] bg-white/[0.018] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Bill {index + 1}</p>
                    {allocations.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove bill ${index + 1}`}
                        onClick={() => setAllocations((current) => current.filter((item) => item.id !== allocation.id))}
                        className="grid size-8 place-items-center text-[#df8a70] hover:bg-[#c96a4e]/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Charge type">
                      <FormSelect
                        className={inputClass}
                        value={allocation.chargeType}
                        onValueChange={(value) => updateAllocation(allocation.id, {
                          chargeType: value as AllocationDraft["chargeType"],
                        })}
                        options={[
                          { value: "rent", label: "Rent" },
                          { value: "light_bill", label: "Light bill" },
                          { value: "other", label: "Other" },
                        ]}
                      />
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
              <DatePickerInput
                name="paidAt"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
                invalid={Boolean(state.errors?.paidAt)}
                required
              />
              {state.errors?.paidAt && <FieldError message={state.errors.paidAt} />}
            </Field>
            <Field label="Payment method">
              <FormSelect
                className={inputClass}
                name="method"
                defaultValue="bank_transfer"
                options={[
                  { value: "bank_transfer", label: "Bank transfer / UPI" },
                  { value: "cash", label: "Cash" },
                  { value: "check", label: "Cheque" },
                  { value: "card", label: "Card" },
                ]}
              />
            </Field>
            <Field label="Transaction reference">
              <input className={inputClass} name="reference" placeholder="UTR, cheque no., etc." />
            </Field>
            <Field label="Note">
              <input className={inputClass} name="note" placeholder="Optional note" />
            </Field>
          </div>

          <div className="flex items-center justify-between border border-[#e4c77a]/20 bg-[#e4c77a]/[0.055] px-4 py-3.5">
            <span className="text-xs font-bold text-white/55">Total received</span>
            <span className="font-display text-xl font-extrabold text-[#e4c77a]">{formatCurrency(total)}</span>
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
        <label className="flex h-11 items-center gap-3 rounded-none border border-white/[0.09] bg-white/[0.018] px-3.5 text-xs font-semibold text-white/65">
          <input
            className="size-4 accent-[#e4c77a]"
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
              <FormSelect
                key={`status-${unit?.id ?? "new"}`}
                className={inputClass}
                name="status"
                defaultValue={unit?.status ?? "vacant"}
                invalid={Boolean(state.errors?.status)}
                options={[
                  { value: "vacant", label: "Vacant" },
                  { value: "occupied", label: "Occupied" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />
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
              <DatePickerInput
                key={`opening-month-${unit?.id ?? "new"}`}
                name="openingMeterReadingDate"
                defaultValue={unit?.openingMeterReadingDate}
                className={inputClass}
                invalid={Boolean(state.errors?.openingMeterReadingDate)}
                monthOnly
                monthYearNavigation
                placeholder="Pick an opening month"
              />
              {state.errors?.openingMeterReadingDate && <FieldError message={state.errors.openingMeterReadingDate} />}
            </Field>
          </div>
          {unit && unit.lastMeterReading !== null && (
            <p className="border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs text-white/45">
              Latest billed reading: <span className="font-bold text-white/70">{unit.lastMeterReading}</span>
              {unit.lastMeterReadingDate ? ` (${unit.lastMeterReadingDate.slice(0, 7)})` : ""}
            </p>
          )}
          {unit?.tenant && (
            <div className="border border-[#7aa18b]/25 bg-[#7aa18b]/10 px-4 py-3 text-xs text-[#9bc4ab]">
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
  const [gstTaxablePercent, setGstTaxablePercent] = useState(String(tenant?.gstTaxablePercent ?? 100));
  const [tdsEnabled, setTdsEnabled] = useState(tenant?.tdsEnabled ?? false);
  const [tdsRate, setTdsRate] = useState(String(tenant?.tdsRate || 10));
  const [monthlyRent, setMonthlyRent] = useState(String(tenant?.monthlyRent ?? ""));
  const baseRent = Math.max(0, Number(monthlyRent) || 0);
  const taxableRent = gstEnabled
    ? (baseRent * (Number(gstTaxablePercent) || 0)) / 100
    : 0;
  const previewGst = gstEnabled ? (taxableRent * (Number(gstRate) || 0)) / 100 : 0;
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
      <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto overscroll-contain">
        <DialogTitle>{editing ? `Edit ${tenant?.name}` : "Add a tenant"}</DialogTitle>
        <DialogDescription>
          Add the tenant first, then set up their lease and monthly rent. Optional tax and rent increase rules are grouped below.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="id" value={tenant?.id ?? ""} />

          <section className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Tenant & unit</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <input required className={inputClass} name="name" defaultValue={tenant?.name} aria-invalid={Boolean(state.errors?.name)} autoComplete="name" placeholder="Tenant name" />
                {state.errors?.name && <FieldError message={state.errors.name} />}
              </Field>
              <Field label="Unit">
                <FormSelect
                  key={`tenant-unit-${tenant?.id ?? "new"}`}
                  required
                  className={inputClass}
                  name="unitId"
                  defaultValue={tenant?.unitId ?? ""}
                  invalid={Boolean(state.errors?.unitId)}
                  placeholder="Select a unit"
                  options={units.map((unit) => ({ value: unit.id, label: unit.label }))}
                />
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

          <section className="space-y-4 border-t border-white/10 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Masked identity details</p>
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
                {!state.errors?.panMasked && <p className="mt-1.5 text-[10px] text-white/35">Automatically stored as AB***1234F.</p>}
              </Field>
              <Field label="GSTIN">
                <input className={inputClass} name="gstin" maxLength={15} defaultValue={tenant?.gstin} placeholder="Optional" />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Lease & rent setup</p>
              <p className="mt-1.5 text-xs leading-5 text-white/40">
                Work through each group in order. Leave any optional field blank when it does not apply.
              </p>
            </div>

            <LeaseFieldGroup
              icon={<CalendarDays className="size-4" />}
              title="1. Lease duration"
              description="Set the agreement dates and the rules for ending the tenancy."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TenantInput label="Lease starts on" name="leaseStart" type="date" value={tenant?.leaseStart} error={state.errors?.leaseStart} />
                <TenantInput label="Lease ends on" name="leaseEnd" type="date" value={tenant?.leaseEnd} error={state.errors?.leaseEnd} />
                <TenantInput
                  label="Minimum stay / lock-in"
                  name="lockInMonths"
                  type="number"
                  value={tenant?.lockInMonths}
                  error={state.errors?.lockInMonths}
                  hint="Number of months before the tenant can end the lease."
                />
                <TenantInput
                  label="Move-out notice"
                  name="noticePeriodMonths"
                  type="number"
                  value={tenant?.noticePeriodMonths}
                  error={state.errors?.noticePeriodMonths}
                  hint="Number of months' notice required before leaving."
                />
              </div>
            </LeaseFieldGroup>

            <LeaseFieldGroup
              icon={<CircleDollarSign className="size-4" />}
              title="2. Monthly rent & billing"
              description="Enter the base rent and choose when each month's bill is created and due."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Monthly base rent (₹)">
                  <input
                    className={inputClass}
                    name="monthlyRent"
                    type="number"
                    min={0}
                    step="any"
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(event.target.value)}
                    aria-invalid={Boolean(state.errors?.monthlyRent)}
                    placeholder="e.g. 25000"
                  />
                  {state.errors?.monthlyRent && <FieldError message={state.errors.monthlyRent} />}
                </Field>
                <TenantInput
                  label="Create bill on day"
                  name="rentBillingDay"
                  type="number"
                  value={tenant?.rentBillingDay ?? 1}
                  error={state.errors?.rentBillingDay}
                  min={1}
                  max={31}
                  hint="Day of the month, from 1 to 31."
                />
                <TenantInput
                  label="Payment due on day"
                  name="rentDueDay"
                  type="number"
                  value={tenant?.rentDueDay ?? tenant?.rentBillingDay ?? 1}
                  error={state.errors?.rentDueDay}
                  min={1}
                  max={31}
                  hint="The monthly deadline for rent."
                />
              </div>
            </LeaseFieldGroup>

            <LeaseFieldGroup
              icon={<WalletCards className="size-4" />}
              title="3. Deposit & starting balance"
              description="Record money already held or owed when adding this tenant to Bhada."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <TenantInput
                  label="Refundable security deposit (₹)"
                  name="securityDeposit"
                  type="number"
                  value={tenant?.securityDeposit}
                  error={state.errors?.securityDeposit}
                  step="any"
                />
                <TenantInput
                  label="Tenant already owes (₹)"
                  name="openingBalance"
                  type="number"
                  value={tenant?.openingBalance ?? 0}
                  error={state.errors?.openingBalance}
                  step="any"
                  hint="Past unpaid amount to carry forward."
                />
                <TenantInput
                  label="Tenant paid in advance (₹)"
                  name="creditBalance"
                  type="number"
                  value={tenant?.creditBalance ?? 0}
                  error={state.errors?.creditBalance}
                  step="any"
                  hint="Unused advance payment or credit."
                />
              </div>
            </LeaseFieldGroup>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Optional: rent bill taxes</p>
              <p className="mt-1.5 text-xs leading-5 text-white/40">
                Turn these on only when they apply to this tenant. TDS is calculated on the GST-inclusive invoice total.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-white/10 bg-white/[0.018] p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-white/70">
                  <input
                    className="size-4 accent-[#e4c77a]"
                    type="checkbox"
                    name="gstEnabled"
                    checked={gstEnabled}
                    onChange={(event) => setGstEnabled(event.target.checked)}
                  />
                  Add GST to rent bills
                </label>
                {gstEnabled && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                    <Field label="Rent subject to GST (%)">
                      <input
                        className={inputClass}
                        name="gstTaxablePercent"
                        type="number"
                        min={0.01}
                        max={100}
                        step="any"
                        value={gstTaxablePercent}
                        onChange={(event) => setGstTaxablePercent(event.target.value)}
                        aria-invalid={Boolean(state.errors?.gstTaxablePercent)}
                      />
                      {state.errors?.gstTaxablePercent && <FieldError message={state.errors.gstTaxablePercent} />}
                    </Field>
                    <p className="text-[10px] leading-4 text-white/35 sm:col-span-2">
                      Use 50% when half the rent is billed with GST and half without GST.
                    </p>
                  </div>
                )}
              </div>
              <div className="border border-white/10 bg-white/[0.018] p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-white/70">
                  <input
                    className="size-4 accent-[#e4c77a]"
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
              <div className="border border-[#e4c77a]/20 bg-[#e4c77a]/[0.045] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e4c77a]/70">Monthly bill preview</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                  <span>Rent {formatCurrency(baseRent)}</span>
                  {gstEnabled && (
                    <span>
                      + GST on {gstTaxablePercent || 0}% ({formatCurrency(taxableRent)}): {formatCurrency(previewGst)}
                    </span>
                  )}
                  {tdsEnabled && <span>− TDS {formatCurrency(previewTds)}</span>}
                  <span className="font-semibold text-[#e4c77a]">= {formatCurrency(previewPayable)} payable</span>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Optional: scheduled rent increase</p>
              <p className="mt-1.5 text-xs leading-5 text-white/40">
                Example: increase the rent by 5% every 12 months, with the next increase on 1 April 2027.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TenantInput label="Rent increase (%)" name="rentEscalationPct" type="number" value={tenant?.rentEscalationPct} error={state.errors?.rentEscalationPct} step="any" />
              <TenantInput label="Increase rent every (months)" name="rentEscalationMonths" type="number" value={tenant?.rentEscalationMonths} error={state.errors?.rentEscalationMonths} />
              <TenantInput label="Next rent increase date" name="nextEscalationDate" type="date" value={tenant?.nextEscalationDate} error={state.errors?.nextEscalationDate} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Lease document</p>
            <Field label="Lease document URL">
              <input className={inputClass} name="leaseDocUrl" type="url" defaultValue={tenant?.leaseDocUrl} aria-invalid={Boolean(state.errors?.leaseDocUrl)} placeholder="https://..." />
              {state.errors?.leaseDocUrl && <FieldError message={state.errors.leaseDocUrl} />}
            </Field>
          </section>

          <label className="flex items-center gap-3 border border-[#7aa18b]/25 bg-[#7aa18b]/[0.07] px-4 py-3 text-sm font-semibold text-[#9bc4ab]">
            <input className="size-4 accent-[#9bc4ab]" type="checkbox" name="isActive" defaultChecked={tenant?.isActive ?? true} />
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
  hint,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  type: "date" | "number";
  value?: string | number | null;
  error?: string;
  hint?: string;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      {type === "date" ? (
        <DatePickerInput
          key={`${name}-${value ?? ""}`}
          className={inputClass}
          name={name}
          defaultValue={typeof value === "string" ? value : undefined}
          invalid={Boolean(error)}
        />
      ) : (
        <input className={inputClass} name={name} type={type} min={min ?? 0} max={max} step={step} defaultValue={value ?? ""} aria-invalid={Boolean(error)} />
      )}
      {error && <FieldError message={error} />}
      {!error && hint && <p className="mt-1.5 text-[10px] leading-4 text-white/35">{hint}</p>}
    </Field>
  );
}

function LeaseFieldGroup({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.018] p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center border border-[#e4c77a]/20 bg-[#e4c77a]/[0.06] text-[#e4c77a]/80">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white/75">{title}</h3>
          <p className="mt-1 text-[11px] leading-4 text-white/40">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
