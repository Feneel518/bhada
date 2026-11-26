"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Building2, ChartNoAxesCombined, CircleDollarSign, CreditCard, HelpCircle, Home, Menu, Search, Settings, LogOut, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BhadaLogo } from "@/components/brand-logo";
import type { BillDocument, BillIssuer } from "@/components/bill-document";
import type { ProfileValues } from "@/app/dashboard/profile/profile-form";
import { authClient } from "@/lib/auth-client";
import type { IncomeOverviewPoint } from "@/lib/dashboard-analytics";
import type { PaymentRecord } from "@/lib/payments";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { type FinancialYearOption } from "@/lib/financial-year";
import type { PropertyRecord, UnitRecord } from "@/lib/properties";
import type { TenantRecord } from "@/lib/tenants";
import type { TenantAnalytics } from "@/lib/tenant-analytics";
import type { TenantLedgerRecord } from "@/lib/tenant-ledgers";
import type { NotificationItem } from "@/lib/notifications";
import { limitsForPlan } from "@/lib/plans";
import { NotificationCenter } from "@/components/notification-center";
import { PortfolioCheckoutButton } from "@/components/portfolio-checkout-button";
import type { SubscriptionReceipt } from "@/lib/subscription-receipts";
import { cn, formatCurrency } from "@/lib/utils";
import styles from "./dashboard.module.css";
import { PropertyOnboarding } from "@/components/property-onboarding";
import { WorkspaceGuide } from "@/components/workspace-guide";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { SubscriptionView } from "@/lib/plans";
import { HelpCenter } from "@/components/workspace/help-center";
import { DashboardSearchResults } from "@/components/workspace/search-results";
import { Overview } from "@/components/workspace/overview";
import { SectionView } from "@/components/workspace/section-view";
import { ElectricityBillDialog } from "@/components/workspace/electricity-bill-dialog";
import { RecordPaymentDialog } from "@/components/workspace/record-payment-dialog";
import { PropertyDialog } from "@/components/workspace/property-dialog";
import { UnitDialog } from "@/components/workspace/unit-dialog";
import { TenantDialog } from "@/components/workspace/tenant-dialog";
import { CollectionList } from "@/components/workspace/collection-list";
import { ImportDialog } from "@/components/workspace/import-dialog";
import { ClaimsPanel } from "@/components/workspace/claims-panel";
import { MeterReadingsPanel } from "@/components/workspace/meter-readings-panel";
import type { MeterSubmissionPrefill } from "@/components/workspace/electricity-bill-dialog";
import type { PendingMeterReading } from "@/lib/meter-readings";
import type { ElectricityBillActionState } from "@/app/dashboard/electricity/actions";
import type { LandlordClaim } from "@/lib/tenant-portal";
import { buildCollection, type CollectionRow } from "@/lib/collection";
import { shareKey, type ShareLinks } from "@/lib/share-keys";
import { reminderLinkFor } from "@/components/workspace/collection-list";
import { useLanguage } from "@/components/language-provider";
import { billShareMessage, portalInviteMessage, whatsappLink } from "@/lib/whatsapp";

const BillDocumentDialog = dynamic(
  () => import("@/components/bill-document").then((module) => module.BillDocumentDialog),
);
const TenantProfileDialog = dynamic(
  () => import("@/components/tenant-profile-dialog").then((module) => module.TenantProfileDialog),
);
const TenantLedgerDialog = dynamic(
  () => import("@/components/tenant-ledger-document").then((module) => module.TenantLedgerDialog),
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
  overviewRentBilling,
  electricityBills,
  financialYearStart,
  financialYearOptions,
  issuer,
  tenantAnalytics,
  tenantLedgers,
  incomeOverview,
  notifications,
  subscriptionReceipts,
  subscription,
  rentalAccess,
  shareLinks,
  today,
  claims = [],
  meterReadings = [],
  appUrl,
}: {
  user: DashboardUser;
  initialSection?: DashboardSection;
  profile?: ProfileValues;
  properties: PropertyRecord[];
  tenants: TenantRecord[];
  payments: PaymentRecord[];
  rentBilling: RentBillingSummary;
  overviewRentBilling: RentBillingSummary;
  electricityBills: ElectricityBillRecord[];
  financialYearStart: number;
  financialYearOptions: FinancialYearOption[];
  issuer: BillIssuer;
  tenantAnalytics: TenantAnalytics[];
  tenantLedgers: TenantLedgerRecord[];
  incomeOverview: IncomeOverviewPoint[];
  notifications: NotificationItem[];
  subscriptionReceipts: SubscriptionReceipt[];
  subscription: SubscriptionView;
  rentalAccess: { propertyIds: string[]; unitIds: string[]; hasLockedRentals: boolean };
  shareLinks: ShareLinks;
  today: string;
  claims?: LandlordClaim[];
  meterReadings?: PendingMeterReading[];
  appUrl: string;
}) {
  const [active, setActive] = useState<DashboardSection>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileSection, setProfileSection] = useState<"plan" | "payouts" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentPrefill, setPaymentPrefill] = useState<{ tenantId: string; amount: number; claim?: LandlordClaim } | null>(null);
  const [electricityBillOpen, setElectricityBillOpen] = useState(false);
  const [meterSubmission, setMeterSubmission] = useState<MeterSubmissionPrefill | undefined>(undefined);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [onboarding, setOnboarding] = useState<{ propertyId?: string } | null>(null);
  const [editingProperty, setEditingProperty] = useState<PropertyRecord | null>(null);
  const [unitEditor, setUnitEditor] = useState<{
    property: PropertyRecord;
    unit: UnitRecord | null;
  } | null>(null);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [profileTenant, setProfileTenant] = useState<TenantRecord | null>(null);
  const [ledgerTenant, setLedgerTenant] = useState<TenantRecord | null>(null);
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
  const limits = limitsForPlan(subscription.plan, subscription.active);
  const writableProperties = properties.filter((item) => rentalAccess.propertyIds.includes(item.id))
    .map((item) => ({ ...item, units: item.units.filter((rental) => rentalAccess.unitIds.includes(rental.id)) }));
  const writableTenants = tenants.filter((item) => rentalAccess.unitIds.includes(item.unitId));
  const outstandingFor = (tenantId: string | null) =>
    tenantId
      ? tenantAnalytics.find((item) => item.tenantId === tenantId)?.totalPending ?? 0
      : 0;

  const collection = useMemo(
    () => buildCollection({
      tenants,
      rentBills: overviewRentBilling.bills,
      electricityBills,
      analytics: tenantAnalytics,
      today,
    }),
    [electricityBills, overviewRentBilling.bills, tenantAnalytics, tenants, today],
  );
  const landlordName = profile?.businessName || issuer.businessName || user.name;
  const { language } = useLanguage();
  const portalUrlFor = (renter: TenantRecord) => `${appUrl}/t/${renter.portalToken}`;
  const reminderOptions = { landlordName, upiId: issuer.upiId ?? "", shareLinks, language, portalUrlFor };
  function remindHref(renter: TenantRecord) {
    const row = collection.find((item) => item.tenant.id === renter.id);
    return row && row.status !== "paid" ? reminderLinkFor(row, reminderOptions) : null;
  }
  function billWhatsappHref(document: BillDocument) {
    const url = shareLinks[shareKey(document.kind, document.bill.id)];
    if (!url) return null;
    const renter = tenants.find((item) => item.id === document.bill.tenantId);
    const row = collection.find((item) => item.tenant.id === document.bill.tenantId);
    if (document.bill.pending > 0.005 && row) {
      return reminderLinkFor({ ...row, outstanding: document.bill.pending, dueDate: document.bill.dueDate, bill: document.kind === "rent" ? { kind: "rent", record: document.bill } : { kind: "electricity", record: document.bill } }, reminderOptions);
    }
    return whatsappLink(renter?.phone, billShareMessage({
      tenantName: renter?.name ?? document.bill.tenantName,
      landlordName,
      label: document.kind === "rent" ? `rent bill ${document.bill.billNumber}` : `electricity bill ${document.bill.billNumber}`,
      url,
      language,
    }));
  }

  function electricitySendHref(bill: NonNullable<ElectricityBillActionState["bill"]>) {
    const renter = bill.tenantId ? tenants.find((item) => item.id === bill.tenantId) : undefined;
    if (!renter) return null;
    return whatsappLink(renter.phone, billShareMessage({
      tenantName: renter.name,
      landlordName,
      label: `electricity bill (${formatCurrency(bill.amount)})`,
      url: bill.shareUrl,
      language,
    }));
  }

  function openElectricityBill(submission?: PendingMeterReading) {
    setMeterSubmission(submission
      ? { id: submission.id, unitId: submission.unitId, readingDate: submission.readingDate, reading: submission.reading, note: submission.note }
      : undefined);
    setElectricityBillOpen(true);
  }

  function confirmClaim(claim: LandlordClaim) {
    const renter = tenants.find((item) => item.id === claim.tenantId);
    if (!renter || !rentalAccess.unitIds.includes(renter.unitId)) {
      toast.error("This tenant's rental is read-only on your current plan.");
      return;
    }
    setPaymentPrefill({ tenantId: claim.tenantId, amount: claim.amount, claim });
    setPaymentOpen(true);
  }

  function openPayment(row?: CollectionRow) {
    if (row && !rentalAccess.unitIds.includes(row.tenant.unitId)) {
      toast.error("This tenant's rental is read-only on your current plan.");
      return;
    }
    setPaymentPrefill(row ? { tenantId: row.tenant.id, amount: row.outstanding } : null);
    setPaymentOpen(true);
  }

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
        import("@/components/tenant-ledger-document"),
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
            accountOutstanding: outstandingFor(bill.tenantId),
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
            accountOutstanding: outstandingFor(bill.tenantId),
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
    if (propertyToEdit && !rentalAccess.propertyIds.includes(propertyToEdit.id)) { toast.error("This property is read-only on your current plan."); return; }
    if (!propertyToEdit) { setOnboarding({}); return; }
    setEditingProperty(propertyToEdit);
    setPropertyOpen(true);
  }

  function openUnit(property: PropertyRecord, unit: UnitRecord | null = null) {
    if (!rentalAccess.propertyIds.includes(property.id) || (unit && !rentalAccess.unitIds.includes(unit.id))) { toast.error("This rental is read-only on your current plan."); return; }
    if (!unit) { setOnboarding({ propertyId: property.id }); return; }
    setUnitEditor({ property, unit });
  }

  function openTenant(tenantToEdit: TenantRecord | null = null) {
    if (tenantToEdit && !rentalAccess.unitIds.includes(tenantToEdit.unitId)) { toast.error("This tenant's rental is read-only on your current plan."); return; }
    if (!tenantToEdit) { setOnboarding({}); return; }
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

  const navigationContent = (<>
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
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
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
              {subscription.trialActive ? "Trial" : subscription.active ? "Active" : "Free"}
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
              {subscription.trialActive ? "Free trial · no automatic charge" : subscription.cancelAtPeriodEnd ? "Downgrade scheduled" : `${limits.name} billing is active`}
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
  </>);

  return (
    <div className={cn("dashboard-shell min-h-screen lg:grid lg:grid-cols-[248px_1fr]", styles.shell)}>
      <aside className={cn("sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r px-4 py-5 lg:flex", styles.sidebar)}>
        {navigationContent}
      </aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="workspace-navigation">
          <SheetTitle className="sr-only">Bhadaa navigation</SheetTitle>
          <SheetDescription className="sr-only">Your rentals, plan and settings</SheetDescription>
          {navigationContent}
        </SheetContent>
      </Sheet>

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
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Bhadaa</p>
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
              className="hidden h-10 items-center gap-2 border-b border-white/15 px-0.5 sm:flex sm:gap-2.5"
              aria-label={`${overviewRentBilling.collectionRate}% collected this month, ${formatCurrency(overviewRentBilling.pendingTotal)} pending`}
              title={`${overviewRentBilling.periodLabel}: ${formatCurrency(overviewRentBilling.paidThisMonth)} collected · ${formatCurrency(overviewRentBilling.pendingTotal)} pending`}
            >
              <CircleDollarSign className="size-4 shrink-0 text-[#e4c77a]" />
              <span className="hidden leading-none min-[380px]:block">
                <span className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35 sm:block">
                  This month
                </span>
                <span className="mt-1 block whitespace-nowrap text-xs font-semibold text-[#edede8]">
                  {overviewRentBilling.collectionRate}% collected
                </span>
              </span>
              <span className="hidden md:block">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Pending
                </span>
                <span className="mt-1 block whitespace-nowrap text-xs font-semibold text-[#e4c77a]">
                  {formatCurrency(overviewRentBilling.pendingTotal)}
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

        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-7 lg:px-9">
          <WorkspaceGuide userId={user.id} subscription={subscription} hasLockedRentals={rentalAccess.hasLockedRentals} showOffer={active === "Overview"}
            onPlan={() => { setProfileSection("plan"); navigateToSection("Profile"); }} />
        </div>

        <div
          key={active}
          className={cn(
            "mx-auto w-full min-w-0 max-w-[1440px] px-4 pt-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-7 lg:px-9 lg:pb-9",
            styles.content,
            styles.sectionTransition,
          )}
        >
          {active === "Overview" ? (
            <Overview
              period={period}
              setPeriod={setPeriod}
              payments={visiblePayments}
              rentBilling={overviewRentBilling}
              properties={properties}
              totalProperties={properties.length}
              incomeOverview={incomeOverview}
              onAddProperty={() => openProperty()}
              onRecordPayment={() => openPayment()}
              onViewPayments={() => navigateToSection("Payments")}
              onViewProperties={() => navigateToSection("Properties")}
              firstName={firstName}
              collection={(
                <>
                <ClaimsPanel claims={claims} onConfirm={confirmClaim} />
                <MeterReadingsPanel readings={meterReadings} onEdit={openElectricityBill} sendHref={electricitySendHref} />
                <CollectionList
                  rows={collection}
                  today={today}
                  landlordName={landlordName}
                  upiId={issuer.upiId ?? ""}
                  shareLinks={shareLinks}
                  portalUrlFor={portalUrlFor}
                  onMarkPaid={openPayment}
                  onAddRental={() => openProperty()}
                  onImport={() => setImportOpen(true)}
                  onAddUpi={() => { setProfileSection("payouts"); navigateToSection("Profile"); }}
                  claimedTenantIds={claims.map((claim) => claim.tenantId)}
                />
                </>
              )}
            />
          ) : active === "Profile" && profile ? (
            <ProfileForm
              key={focusedSubscriptionReceiptId ?? profileSection ?? "profile"}
              email={user.email}
              initialValues={profile}
              subscription={subscription}
              receipts={subscriptionReceipts}
              initialSection={focusedSubscriptionReceiptId ? "receipts" : profileSection ?? "business"}
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
              allowedPropertyIds={rentalAccess.propertyIds}
              onAddProperty={() => openProperty()}
              onEditProperty={openProperty}
              onAddUnit={(property) => openUnit(property)}
              onEditUnit={(property, unit) => openUnit(property, unit)}
              onRecordPayment={() => openPayment()}
              onAddElectricityBill={() => openElectricityBill()}
              onAddTenant={() => openTenant()}
              onEditTenant={openTenant}
              onViewTenant={setProfileTenant}
              onViewRentBill={(bill) => setBillDocument({
                kind: "rent",
                bill,
                tenant: tenants.find((item) => item.id === bill.tenantId) ?? null,
                accountOutstanding: outstandingFor(bill.tenantId),
              })}
              remindHref={remindHref}
              portalInviteHref={(renter) => whatsappLink(renter.phone, portalInviteMessage({
                tenantName: renter.name,
                landlordName,
                url: portalUrlFor(renter),
                language,
              }))}
              onImport={() => setImportOpen(true)}
              onViewElectricityBill={(bill) => setBillDocument({
                kind: "electricity",
                bill,
                tenant: bill.tenantId
                  ? tenants.find((item) => item.id === bill.tenantId) ?? null
                  : null,
                accountOutstanding: outstandingFor(bill.tenantId),
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
        <button type="button" className={cn(styles.mobileNavItem, (active === "Profile" || active === "Help center") && styles.mobileNavItemActive)}
          aria-label="More: settings and help" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}><Menu className="size-[19px]" /><span>More</span></button>
      </nav>

      {paymentOpen && (
        <RecordPaymentDialog
          open
          onOpenChange={setPaymentOpen}
          tenants={writableTenants}
          initialTenantId={paymentPrefill?.tenantId}
          initialAmount={paymentPrefill?.amount}
          landlordName={landlordName}
          claim={paymentPrefill?.claim}
        />
      )}
      {electricityBillOpen && (
        <ElectricityBillDialog
          open
          onOpenChange={setElectricityBillOpen}
          properties={writableProperties}
          submission={meterSubmission}
          sendHref={electricitySendHref}
        />
      )}
      {propertyOpen && (
        <PropertyDialog
          property={editingProperty}
          open
          onOpenChange={setPropertyOpen}
        />
      )}
      {onboarding && <PropertyOnboarding properties={writableProperties} initialPropertyId={onboarding.propertyId} onClose={() => setOnboarding(null)} onImport={() => setImportOpen(true)} />}
      {importOpen && <ImportDialog properties={writableProperties} onClose={() => setImportOpen(false)} />}
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
          whatsappHref={billWhatsappHref(billDocument)}
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
          onViewLedger={(tenant) => {
            setProfileTenant(null);
            setLedgerTenant(tenant);
          }}
          onClose={() => setProfileTenant(null)}
        />
      )}
      {ledgerTenant && (
        <TenantLedgerDialog
          tenant={ledgerTenant}
          ledger={tenantLedgers.find((item) => item.tenantId === ledgerTenant.id) ?? null}
          financialYearLabel={rentBilling.financialYearLabel}
          issuer={issuer}
          onClose={() => setLedgerTenant(null)}
        />
      )}
    </div>
  );
}
