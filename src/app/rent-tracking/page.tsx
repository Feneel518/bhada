import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  FileText,
  History,
  ReceiptIndianRupee,
  Users,
  WalletCards,
} from "lucide-react";
import { BhadaLogo } from "@/components/brand-logo";
import { JsonLd } from "@/components/json-ld";
import {
  SITE_ALTERNATE_NAME,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const title = "Rent Tracking Software for Landlords in India";
const description =
  "Track rent payments, monthly dues, overdue balances, tenant history, and rental income with Bhada—the simple rent tracker for landlords in India.";
const pageUrl = `${SITE_URL}/rent-tracking`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "rent tracking",
    "rent tracker",
    "rent tracking app",
    "rent tracking software",
    "rent payment tracker",
    "rent collection tracker",
    "tenant rent tracker",
    "landlord rent tracker India",
    "Bhadaa",
    "Bhadaa rent tracker",
  ],
  alternates: { canonical: "/rent-tracking" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/rent-tracking",
    siteName: SITE_NAME,
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bhada rent tracking software for landlords in India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/twitter-image"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}/#webpage`,
      url: pageUrl,
      name: title,
      description,
      inLanguage: "en-IN",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#app` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${pageUrl}/#software`,
      name: `${SITE_NAME} Rent Tracker`,
      alternateName: [`${SITE_ALTERNATE_NAME} Rent Tracker`, SITE_ALTERNATE_NAME],
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: pageUrl,
      description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Rent tracking software",
          item: pageUrl,
        },
      ],
    },
  ],
};

const trackingFeatures = [
  {
    icon: WalletCards,
    title: "Paid, due, and overdue rent",
    text: "See the current payment status of every unit without checking separate spreadsheets, bank messages, or chats.",
  },
  {
    icon: History,
    title: "Complete rent history",
    text: "Keep bills, recorded payments, partial payments, outstanding balances, and advance credit connected month by month.",
  },
  {
    icon: Users,
    title: "Tenant-wise tracking",
    text: "Tie each rent amount, due date, payment, and balance to the correct tenant and rental unit.",
  },
  {
    icon: BellRing,
    title: "Rent due reminders",
    text: "Surface upcoming dues and overdue rent from the same dashboard you use to manage the rest of the tenancy.",
  },
  {
    icon: ReceiptIndianRupee,
    title: "Accurate monthly totals",
    text: "Track base rent alongside GST, TDS, electricity, and other charges so the amount due remains explainable.",
  },
  {
    icon: FileText,
    title: "PDF rent bills",
    text: "Download and share itemised rent bills while keeping the payment status and outstanding amount in your records.",
  },
];

export default function RentTrackingPage() {
  return (
    <main className="min-h-screen bg-[#111111] font-sans text-[#EDEDE8] selection:bg-[#E4C77A] selection:text-[#111111]">
      <JsonLd data={structuredData} />
      <a
        href="#content"
        className="fixed top-3 left-3 z-[100] -translate-y-20 bg-[#EDEDE8] px-4 py-2 text-sm font-semibold text-[#111111] transition focus:translate-y-0"
      >
        Skip to content
      </a>

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1296px] items-center justify-between px-5 py-5 sm:px-10 lg:px-0">
          <Link href="/" aria-label="Bhada home">
            <BhadaLogo
              className="gap-3"
              markClassName="size-8 text-[#EDEDE8]"
              wordmarkClassName="text-lg text-[#EDEDE8]"
            />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-5 text-xs sm:gap-8">
            <Link href="/rent-management-software" className="hidden text-white/55 transition hover:text-white sm:block">
              Rent management
            </Link>
            <Link
              href="/sign-in"
              className="border border-white/30 px-4 py-2.5 font-semibold transition hover:border-white/60 hover:bg-white/[0.04]"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <div id="content">
        <section className="border-b border-white/10 px-5 py-16 sm:px-10 sm:py-24 lg:px-[72px] lg:py-28">
          <div className="mx-auto max-w-[1120px]">
            <nav aria-label="Breadcrumb" className="mb-10 text-xs text-white/45">
              <Link href="/" className="transition hover:text-white">Home</Link>
              <span aria-hidden="true" className="px-2">/</span>
              <span>Rent tracking software</span>
            </nav>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)] lg:items-end">
              <div>
                <p className="mb-6 text-xs font-semibold tracking-[2px] text-[#E4C77A] uppercase">
                  Simple rent tracking for Indian landlords
                </p>
                <h1 className="max-w-4xl font-display text-[clamp(2.6rem,7vw,5rem)] leading-[1.05] tracking-[-1px]">
                  Rent tracking software that shows exactly what is paid and what is due.
                </h1>
              </div>
              <div>
                <p className="text-base leading-7 text-white/60">
                  Bhada keeps rent payments, overdue balances, tenant history, and monthly bills together—so you can track every rental unit without rebuilding a spreadsheet.
                </p>
                <Link
                  href="/sign-in"
                  className="group mt-7 inline-flex min-h-12 items-center gap-2 bg-[#EDEDE8] px-7 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-white"
                >
                  Start tracking rent free
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                <p className="mt-4 text-xs text-white/40">Bhada is available at Bhadaa.in. Start with one property.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-16 sm:px-10 sm:py-24 lg:px-[72px]">
          <div className="mx-auto max-w-[1120px]">
            <p className="text-xs font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">One rent tracker, every unit</p>
            <h2 className="mt-5 max-w-3xl font-display text-3xl leading-tight sm:text-4xl">
              Follow the full rent cycle, not just a paid checkbox.
            </h2>
            <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {trackingFeatures.map(({ icon: Icon, title: featureTitle, text }) => (
                <article key={featureTitle} className="bg-[#111111] p-7 sm:p-8">
                  <span className="grid size-11 place-items-center border border-white/15 text-[#E4C77A]">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-8 font-display text-xl">{featureTitle}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-16 sm:px-10 sm:py-24 lg:px-[72px]">
          <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Building2 className="size-8 text-[#E4C77A]" />
              <h2 className="mt-6 font-display text-3xl leading-tight sm:text-4xl">
                A rent collection tracker built around real landlord workflows.
              </h2>
            </div>
            <div className="space-y-5 text-[15px] leading-7 text-white/60">
              <p>
                A useful rent payment tracker needs context. A payment belongs to a tenant, a tenant belongs to a unit, and the amount due may include more than base rent. Bhada keeps those records linked so the portfolio total and the tenant history stay consistent.
              </p>
              <p>
                Record full, partial, or advance payments. Any unpaid amount remains outstanding, while extra payment can carry forward as credit. This makes it easier to answer who paid rent, how much remains due, and which month a payment settled.
              </p>
              <p>
                Need more than tracking? Bhada also includes property and tenant records, rent billing, GST and TDS settings, submeter electricity charges, reminders, and shareable PDF bills in its broader <Link href="/rent-management-software" className="text-[#E4C77A] underline decoration-[#E4C77A]/35 underline-offset-4 hover:decoration-[#E4C77A]">rent management software</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 text-center sm:px-10 sm:py-28">
          <CheckCircle2 className="mx-auto size-8 text-[#E4C77A]" />
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight sm:text-5xl">
            Know the status of every rent payment this month.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/50">
            Add your first property for free and replace scattered rent records with one clear tracker.
          </p>
          <Link
            href="/sign-in"
            className="group mt-8 inline-flex min-h-12 items-center gap-2 bg-[#EDEDE8] px-8 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-white"
          >
            Start tracking rent
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </section>
      </div>

      <footer className="border-t border-white/10 px-5 py-10 sm:px-10 lg:px-[72px]">
        <div className="mx-auto flex max-w-[1120px] flex-col justify-between gap-5 text-xs text-white/40 sm:flex-row sm:items-center">
          <Link href="/" className="text-white/65 transition hover:text-white">Bhada</Link>
          <p>Rent tracking and management software for independent landlords in India.</p>
        </div>
      </footer>
    </main>
  );
}
