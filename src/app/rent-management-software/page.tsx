import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  Calculator,
  Check,
  FileText,
  Gauge,
  Receipt,
  ShieldCheck,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { BhadaLogo } from "@/components/brand-logo";
import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const title = "Rent Management Software for Indian Landlords";
const description =
  "Manage properties, tenants, rent bills, GST, TDS, submeter electricity, payments, reminders, and PDF bills with Bhada—built for independent landlords in India.";
const pageUrl = `${SITE_URL}/rent-management-software`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "rent management software",
    "landlord software India",
    "rent tracking app for landlords",
    "rental property management software India",
    "rent billing software",
  ],
  alternates: { canonical: "/rent-management-software" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/rent-management-software",
    siteName: SITE_NAME,
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bhada rent management software for independent landlords in India",
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
          name: "Rent management software",
          item: pageUrl,
        },
      ],
    },
  ],
};

const features = [
  {
    icon: Building2,
    title: "Properties and units",
    text: "Keep every property and rental unit in one organised portfolio, without maintaining a separate spreadsheet for each building.",
  },
  {
    icon: Users,
    title: "Tenant records",
    text: "Connect each tenant to the right unit, rent amount, due date, tax settings, and billing history.",
  },
  {
    icon: Receipt,
    title: "GST and TDS-ready bills",
    text: "Configure GST and TDS at tenant level so the right amounts are calculated when monthly rent bills are created.",
  },
  {
    icon: Zap,
    title: "Submeter electricity",
    text: "Enter meter readings and the per-unit rate to calculate consumption and add electricity to the same monthly bill.",
  },
  {
    icon: WalletCards,
    title: "Payment tracking",
    text: "Record full, partial, or advance payments and keep outstanding balances connected to their bills.",
  },
  {
    icon: FileText,
    title: "Shareable PDF bills",
    text: "Download a clean itemised bill for WhatsApp, email, print, or your own records whenever you need it.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Add the property",
    text: "Create the property and its units, then add the tenants you currently manage.",
  },
  {
    step: "02",
    title: "Set the billing rules",
    text: "Enter rent, due dates, electricity rates, and any GST or TDS settings that apply.",
  },
  {
    step: "03",
    title: "Run the month from one dashboard",
    text: "Review bills, record payments, spot overdue balances, and download PDFs without rebuilding the numbers elsewhere.",
  },
];

const fitChecks = [
  "You manage your own residential or commercial rental units",
  "Rent records currently live in Excel, a notebook, or scattered chats",
  "Some tenants have electricity submeters or different tax settings",
  "You want a clear view of paid, due, and overdue rent",
  "You need itemised bills you can download and share",
];

export default function RentManagementSoftwarePage() {
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
            <Link href="/#features" className="hidden text-white/55 transition hover:text-white sm:block">
              Features
            </Link>
            <Link href="/#pricing" className="hidden text-white/55 transition hover:text-white sm:block">
              Pricing
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
              <span>Rent management software</span>
            </nav>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)] lg:items-end">
              <div>
                <p className="mb-6 text-xs font-semibold tracking-[2px] text-[#E4C77A] uppercase">
                  Built for independent landlords in India
                </p>
                <h1 className="max-w-4xl font-display text-[clamp(2.6rem,7vw,5rem)] leading-[1.05] tracking-[-1px]">
                  Rent management software that keeps the whole month connected.
                </h1>
              </div>
              <div>
                <p className="text-base leading-7 text-white/60">
                  Bhada brings properties, tenants, rent billing, submeter electricity, payments, reminders, and PDF bills into one focused landlord workspace.
                </p>
                <Link
                  href="/sign-in"
                  className="group mt-7 inline-flex min-h-12 items-center gap-2 bg-[#EDEDE8] px-7 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-white"
                >
                  Start for free
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                <p className="mt-4 text-xs text-white/40">No setup fee. Start with one property.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-16 sm:px-10 sm:py-20 lg:px-[72px]">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-xs font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">Why landlords use it</p>
                <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">
                  Replace the patchwork, not your process.
                </h2>
              </div>
              <div className="space-y-5 text-[15px] leading-7 text-white/60">
                <p>
                  Rent administration becomes difficult less because any one task is complicated and more because the information is spread out. Tenant terms sit in one file, meter readings in another, payment screenshots in chat, and outstanding amounts in someone&apos;s memory.
                </p>
                <p>
                  Good rental property management software gives those records a shared structure. A tenant belongs to a unit, a bill belongs to a billing period, and a payment changes the balance you see. Bhada is designed around that practical monthly cycle for landlords managing their own portfolio.
                </p>
                <p>
                  It is deliberately focused: organise the portfolio, calculate recurring charges, see what is outstanding, and create a record you can share. You do not need an enterprise property-management system just to know who has paid this month.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-16 sm:px-10 sm:py-24 lg:px-[72px]">
          <div className="mx-auto max-w-[1120px]">
            <p className="text-xs font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">Core capabilities</p>
            <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
              Everything needed between setting the rent and closing the month.
            </h2>
            <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title: featureTitle, text }) => (
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
          <div className="mx-auto max-w-[1120px]">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <Gauge className="size-8 text-[#E4C77A]" />
                <h2 className="mt-6 font-display text-3xl leading-tight sm:text-4xl">A simpler monthly rent workflow</h2>
                <p className="mt-5 text-sm leading-7 text-white/50">
                  Set the recurring details once, then work from the current state of the portfolio instead of reconstructing it each month.
                </p>
              </div>
              <ol className="border-b border-white/10">
                {workflow.map((item) => (
                  <li key={item.step} className="grid grid-cols-[44px_1fr] gap-5 border-t border-white/10 py-7 sm:grid-cols-[60px_1fr]">
                    <span className="font-display text-sm text-[#E4C77A]">{item.step}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-16 sm:px-10 sm:py-24 lg:px-[72px]">
          <div className="mx-auto grid max-w-[1120px] gap-px bg-white/10 lg:grid-cols-2">
            <article className="bg-[#111111] p-7 sm:p-10">
              <Calculator className="size-7 text-[#E4C77A]" />
              <h2 className="mt-6 font-display text-2xl sm:text-3xl">Rent, GST, TDS, and electricity on one bill</h2>
              <p className="mt-5 text-sm leading-7 text-white/55">
                When rent is only one part of the amount due, a simple paid/unpaid checkbox is not enough. Bhada can keep base rent, submeter electricity, GST, TDS deductions, and other bill amounts visible as separate line items while presenting one final balance.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/55">
                Tax treatment varies by agreement and circumstance. The software applies the rates you configure; confirm the correct GST and TDS setup with your tax adviser.
              </p>
            </article>
            <article className="bg-[#111111] p-7 sm:p-10">
              <BellRing className="size-7 text-[#E4C77A]" />
              <h2 className="mt-6 font-display text-2xl sm:text-3xl">Balances that remain understandable</h2>
              <p className="mt-5 text-sm leading-7 text-white/55">
                Real payments do not always match a bill exactly. A tenant may pay part now, settle several bills together, or pay more than the current amount. Bhada records allocations and carries the remaining balance or credit forward, so the dashboard and billing history tell the same story.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/55">
                In-app reminders also surface due rent, overdue balances, lease expiries, and rent escalations that need attention.
              </p>
            </article>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-16 sm:px-10 sm:py-24 lg:px-[72px]">
          <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-xs font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">Is Bhada a good fit?</p>
              <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">Made for owners who manage rentals directly.</h2>
              <p className="mt-5 text-sm leading-7 text-white/50">
                Bhada is a practical fit for independent landlords with a small or growing portfolio who want control without the overhead of a large property-management suite.
              </p>
            </div>
            <ul className="space-y-4">
              {fitChecks.map((item) => (
                <li key={item} className="flex gap-3 border-b border-white/10 pb-4 text-sm leading-6 text-white/65">
                  <Check className="mt-1 size-4 shrink-0 text-[#E4C77A]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 py-20 text-center sm:px-10 sm:py-28">
          <ShieldCheck className="mx-auto size-8 text-[#E4C77A]" />
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight sm:text-5xl">
            See your rent portfolio clearly this month.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/50">
            Add your first property for free and keep rent billing, payments, and tenant records in one place.
          </p>
          <Link
            href="/sign-in"
            className="group mt-8 inline-flex min-h-12 items-center gap-2 bg-[#EDEDE8] px-8 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-white"
          >
            Start for free
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </section>
      </div>

      <footer className="border-t border-white/10 px-5 py-10 sm:px-10 lg:px-[72px]">
        <div className="mx-auto flex max-w-[1120px] flex-col justify-between gap-5 text-xs text-white/40 sm:flex-row sm:items-center">
          <Link href="/" className="text-white/65 transition hover:text-white">Bhada</Link>
          <p>Rent management software for independent landlords in India.</p>
        </div>
      </footer>
    </main>
  );
}
