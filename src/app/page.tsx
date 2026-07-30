import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  ArrowRight,
  BellRing,
  Building2,
  Check,
  FileText,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Layers,
  Receipt,
  ShieldCheck,
  Share2,
  WalletCards,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { LandingFaq } from "@/components/landing-faq";

export const metadata: Metadata = {
  title: "Rent management for independent landlords",
  description:
    "Manage rent, GST and TDS invoices, submeter electricity, payments, reminders, and PDF bills from one calm landlord dashboard.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Bhada — Rent management, without the runaround",
    description:
      "Rent billing, submeter electricity, payments, and reminders in one dashboard for independent landlords.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Bhada — Rent management, without the runaround",
    description:
      "Rent billing, submeter electricity, payments, and reminders in one calm dashboard.",
  },
};

const capabilities = [
  { icon: Receipt, value: "GST + TDS", label: "Compliant billing, out of the box" },
  { icon: Zap, value: "Rent + Electricity", label: "One combined monthly bill" },
  { icon: LayoutDashboard, value: "One dashboard", label: "Every property, every tenant" },
];

const features = [
  {
    icon: Receipt,
    num: "01",
    title: "GST & TDS-ready invoicing",
    desc: "Configure GST and TDS per tenant, and every rent bill calculates and applies them automatically — no manual math, no surprises.",
  },
  {
    icon: Zap,
    num: "02",
    title: "Submeter electricity billing",
    desc: "Log a meter reading each month and get an accurate, auto-calculated electricity charge for that unit alone.",
  },
  {
    icon: Layers,
    num: "03",
    title: "Combined monthly bills",
    desc: "Rent, electricity, and other charges roll into one bill the moment the billing period starts — nothing to assemble by hand.",
  },
  {
    icon: WalletCards,
    num: "04",
    title: "Flexible payment allocation",
    desc: "Record a payment as a lump sum or split it bill-by-bill. Partial payments are tracked and the remainder carries forward as credit.",
  },
  {
    icon: FileText,
    num: "05",
    title: "PDF bills, shareable anywhere",
    desc: "Download or share a polished PDF bill straight from the dashboard, in one tap — ready for WhatsApp, email, or print.",
  },
  {
    icon: BellRing,
    num: "06",
    title: "Built-in reminders",
    desc: "In-app notifications flag overdue rent, upcoming dues, lease expiries, and rent escalations before they slip through.",
  },
];

const units = [
  { name: "Unit 2A", tenant: "R. Mehta", amount: "₹18,500", status: "PAID", statusColor: "rgba(237,237,232,0.4)" },
  { name: "Unit 3B", tenant: "S. Iyer", amount: "₹24,850", status: "DUE", statusColor: "#E4C77A" },
  { name: "Unit 1C", tenant: "A. Khanna", amount: "₹21,000", status: "PAID", statusColor: "rgba(237,237,232,0.4)" },
  { name: "Unit 4D", tenant: "P. Nair", amount: "₹19,200", status: "OVERDUE", statusColor: "#C96A4E" },
];

const lineItems = [
  { label: "Rent", amount: "₹20,000" },
  { label: "Electricity (submeter)", amount: "₹2,400" },
  { label: "GST", amount: "₹2,240" },
  { label: "TDS deducted", amount: "−₹200" },
];

const reasons = [
  {
    icon: Receipt,
    title: "No more spreadsheet math",
    desc: "GST, TDS, and submeter electricity charges calculate themselves, correctly, every single month.",
  },
  {
    icon: Gauge,
    title: "Nothing falls through",
    desc: "In-app reminders surface overdue rent, upcoming dues, and expiring leases before they become a problem.",
  },
  {
    icon: Layers,
    title: "One place for every property",
    desc: "Properties, units, tenants, and payments — all connected in a single, calm dashboard.",
  },
];

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const primaryHref = session ? "/dashboard" : "/sign-in";
  const primaryLabel = session ? "Open dashboard" : "Start for free";

  return (
    <main className="min-h-screen overflow-x-clip bg-[#111111] font-sans text-[#EDEDE8] selection:bg-[#E4C77A] selection:text-[#111111]">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-20 bg-[#EDEDE8] px-4 py-2 text-sm font-semibold text-[#111111] transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="h-px w-full bg-linear-to-r from-transparent via-[#E4C77A]/50 to-transparent" />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-10 sm:py-6 lg:px-[72px]">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Bhada home">
            <Logo />
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-10 text-xs tracking-[0.5px] text-white/55 uppercase md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {!session && (
              <Link href="/sign-in" className="hidden text-xs tracking-[0.5px] text-white/55 uppercase transition hover:text-white sm:block">
                Sign in
              </Link>
            )}
            <Link
              href={primaryHref}
              className="border border-white/30 px-4 py-2.5 text-[11px] font-semibold tracking-[0.5px] uppercase transition hover:border-white/60 hover:bg-white/[0.04] sm:px-5 sm:text-xs"
            >
              <span className="sm:hidden">{session ? "Dashboard" : "Start free"}</span>
              <span className="hidden sm:inline">{session ? "Dashboard" : "Start free"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="main-content" className="relative scroll-mt-8 overflow-hidden border-b border-white/10 px-5 pt-16 pb-14 sm:px-10 sm:pt-24 sm:pb-20 lg:px-[72px] lg:pt-[124px] lg:pb-24">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-[#E4C77A]/[0.06] blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 size-[28rem] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1296px] items-end gap-10 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,1fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="mb-6 text-[11px] font-semibold tracking-[2px] text-[#E4C77A] uppercase sm:mb-7 sm:text-xs">For independent landlords</p>
            <h1 className="max-w-[900px] font-display text-[clamp(2.75rem,11.5vw,5.5rem)] leading-[1.02] tracking-[-1px] lg:tracking-[-1.5px]">
              Rent management,
              <br />
              without the runaround.
            </h1>
          </div>
          <div className="max-w-md pb-1 lg:pb-2">
            <p className="mb-8 text-[15px] leading-7 text-white/60 sm:text-[17px]">
              GST &amp; TDS-ready invoicing, submeter electricity billing, in-app reminders, and one-tap PDF bills — one dashboard, every property.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link href={primaryHref} className="group inline-flex min-h-12 items-center gap-2 bg-[#EDEDE8] px-7 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-white">
                {primaryLabel} <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="mt-7 grid gap-2 text-xs text-white/45 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {["Free to get started", "Set up in minutes", "Your data stays yours"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-[#E4C77A]" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITY STRIP */}
      <section aria-label="Core capabilities" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 sm:grid-cols-3">
          {capabilities.map((c, index) => (
          <div
            key={c.value}
            className={`group px-5 py-9 transition duration-300 hover:bg-white/[0.02] sm:px-8 sm:py-11 lg:px-12 ${index < capabilities.length - 1 ? "border-b border-white/10 sm:border-r sm:border-b-0" : ""}`}
          >
            <span className="mb-6 grid size-10 place-items-center border border-white/15 text-[#E4C77A] transition duration-300 group-hover:border-[#E4C77A]/50 group-hover:bg-[#E4C77A]/5">
              <c.icon className="size-5" />
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-[34px]">{c.value}</h2>
            <p className="mt-2 text-[11px] leading-5 tracking-[0.8px] text-white/45 uppercase">{c.label}</p>
          </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="scroll-mt-8 border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto max-w-[1296px]">
          <div className="mb-14 grid gap-6 sm:mb-16 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-5 text-[11px] font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">
                From bill to payment
              </p>
              <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-[-0.5px] sm:text-4xl lg:text-[44px]">
                One place for the entire rent cycle.
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-white/50 sm:text-[15px] sm:leading-7 lg:justify-self-end">
              The recurring work stays connected—from calculating the month&apos;s charges to recording the final payment.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, num, title, desc }) => (
              <article
                key={num}
                className="group flex min-h-[260px] flex-col bg-[#111111] p-7 transition duration-300 hover:bg-white/[0.025] sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center border border-white/15 text-[#E4C77A] transition duration-300 group-hover:border-[#E4C77A]/50 group-hover:bg-[#E4C77A]/5">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-display text-sm text-white/20 transition duration-300 group-hover:text-white/35">
                    {num}
                  </span>
                </div>
                <div className="mt-auto pt-10">
                  <h3 className="font-display text-xl leading-snug sm:text-[22px]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* APP MOCKUPS */}
      <div id="how-it-works" className="scroll-mt-8 border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto grid max-w-[1296px] grid-cols-1 gap-px bg-white/10 lg:grid-cols-2">
          {/* Dashboard mockup */}
          <article className="flex h-full flex-col bg-[#111111] p-7 sm:p-11">
            <div className="mb-1.5 font-display text-xl sm:text-2xl">One dashboard, every property</div>
            <div className="mb-8 text-sm text-white/50 sm:mb-9">Live rent status across all units, at a glance.</div>
            <div className="flex flex-1 flex-col overflow-hidden border border-white/15 bg-linear-to-b from-white/[0.025] to-transparent">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                <div className="text-xs tracking-[1px] text-white/50 uppercase">This Month&apos;s Collections</div>
                <div className="font-display text-xl sm:text-2xl">₹4,82,000</div>
              </div>
              {units.map((u) => (
                <div key={u.name} className="flex flex-1 items-center justify-between border-t border-white/[0.06] px-5 py-4 sm:px-6">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="mt-0.5 text-xs text-white/40">{u.tenant}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">{u.amount}</div>
                    <div className="text-[11px] tracking-[0.5px]" style={{ color: u.statusColor }}>{u.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Bill mockup */}
          <article className="flex h-full flex-col bg-[#111111] p-7 sm:p-11">
            <div className="mb-1.5 font-display text-xl sm:text-2xl">Rent, electricity, and tax in one bill</div>
            <div className="mb-8 text-sm text-white/50 sm:mb-9">GST and TDS calculated automatically, ready to share as a PDF.</div>
            <div className="flex flex-1 flex-col border border-white/15 bg-linear-to-b from-white/[0.025] to-transparent p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <div className="font-display text-base sm:text-[17px]">Bill #RB-2607-014</div>
                  <div className="mt-1 text-xs text-white/40">Sunrise Apartments · Unit 3B</div>
                </div>
                <div className="text-[11px] tracking-[0.5px] text-[#E4C77A]">DUE JUL 05</div>
              </div>
              <div className="border-t border-white/10 pt-4">
                {lineItems.map((li) => (
                  <div key={li.label} className="flex justify-between py-1.5 text-[13px] text-white/65">
                    <div>{li.label}</div>
                    <div>{li.amount}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-white/15 pt-4">
                <div className="text-xs tracking-[1px] text-white/50 uppercase">Total Due</div>
                <div className="font-display text-2xl">₹24,440</div>
              </div>
              <div className="mt-auto flex gap-3 pt-6">
                <div className="flex flex-1 items-center justify-center gap-2 border border-[#EDEDE8] py-3 text-[13px] transition hover:bg-white hover:text-[#111111]">
                  <FileText className="size-3.5" /> Download PDF
                </div>
                <div className="flex flex-1 items-center justify-center gap-2 border border-transparent py-3 text-[13px] text-white/60">
                  <Share2 className="size-3.5" /> Share
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* WHY IT WORKS */}
      <div className="border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto max-w-[1296px]">
        <div className="mb-14 font-display text-3xl sm:mb-16 sm:text-4xl lg:text-[44px]">
          No more chasing rent by memory.
        </div>
        <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-3">
          {reasons.map(({ icon: Icon, title, desc }, index) => (
            <div key={title} className="group relative bg-[#111111] p-7 transition duration-300 hover:bg-white/[0.02] sm:p-9">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center border border-white/15 text-[#E4C77A] transition duration-300 group-hover:border-[#E4C77A]/50 group-hover:bg-[#E4C77A]/5">
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-2xl text-white/10">0{index + 1}</span>
              </div>
              <div className="mt-7 text-base font-semibold sm:text-lg">{title}</div>
              <div className="mt-2.5 text-sm leading-relaxed text-white/55">{desc}</div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-8 border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto grid max-w-[1296px] gap-12 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)] lg:gap-24">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <span className="mb-6 grid size-10 place-items-center border border-white/15 text-[#E4C77A]">
              <HelpCircle className="size-[18px]" />
            </span>
            <p className="text-[11px] font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">
              Good to know
            </p>
            <h2 className="mt-5 max-w-md font-display text-3xl leading-tight sm:text-4xl lg:text-[44px]">
              The details, without the fine print.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/50 sm:text-[15px] sm:leading-7">
              Straight answers about billing, payments, electricity, and privacy before you add your first property.
            </p>
          </div>

          <div>
            <LandingFaq />
            <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
              <p className="max-w-md text-sm leading-6 text-white/50">
                Ready to see it with your own properties and tenants?
              </p>
              <Link
                href={primaryHref}
                className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#E4C77A] transition hover:text-[#f0da9d]"
              >
                {primaryLabel}
                <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="relative overflow-hidden px-6 py-20 text-center sm:px-10 sm:py-24 lg:py-[120px]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E4C77A]/[0.06] blur-[140px]" />
        <div className="relative">
          <div className="mx-auto mb-6 max-w-2xl font-display text-4xl tracking-[-1px] sm:text-5xl lg:text-[56px]">
            Stop tracking rent in your head.
          </div>
          <div className="mb-10 text-base text-white/55 sm:text-[17px]">Set up your first property in under 3 minutes.</div>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/45">
            {["GST & TDS ready", "Submeter billing", "One-tap PDF bills"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-[#E4C77A]" /> {item}
              </span>
            ))}
          </div>
          <Link href={primaryHref} className="group inline-flex items-center gap-2 bg-[#EDEDE8] px-9 py-[18px] text-sm font-semibold text-[#111111] transition hover:bg-white">
            {primaryLabel} <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-0.5" />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/40">
            <ShieldCheck className="size-3.5 text-[#E4C77A]" /> Your data stays private, scoped to your account alone.
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="px-5 py-16 sm:px-10 sm:py-20 lg:px-[72px]">
        <div className="mx-auto max-w-[1296px]">
        <div className="grid gap-12 sm:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-display text-lg text-[#EDEDE8]">
              <Building2 className="size-4" /> bhada
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              Rent, GST &amp; TDS billing, submeter electricity, and payments — one calm dashboard for independent landlords.
            </p>
          </div>
          <div>
            <div className="mb-5 text-xs tracking-[1px] text-white/40 uppercase">Product</div>
            <div className="flex flex-col gap-3.5 text-sm text-white/60">
              <a href="#features" className="transition hover:text-white">Features</a>
              <a href="#how-it-works" className="transition hover:text-white">How it works</a>
              <a href="#faq" className="transition hover:text-white">FAQ</a>
            </div>
          </div>
          <div>
            <div className="mb-5 text-xs tracking-[1px] text-white/40 uppercase">Account</div>
            <div className="flex flex-col gap-3.5 text-sm text-white/60">
              {!session && (
                <Link href="/sign-in" className="transition hover:text-white">Sign in</Link>
              )}
              <Link href={primaryHref} className="transition hover:text-white">{primaryLabel}</Link>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row">
          <div>© 2026 Bhada. Rent, without the runaround.</div>
          <div>Built for independent landlords.</div>
        </div>
        </div>
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <>
      <span className="grid size-8 place-items-center border border-white/20">
        <Building2 className="size-4" />
      </span>
      <span className="font-display text-lg tracking-[0.5px] text-[#EDEDE8]">bhada</span>
    </>
  );
}
