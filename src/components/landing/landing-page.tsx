import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  MessageCircle,
  QrCode,
  Receipt,
  ReceiptText,
  ShieldCheck,
  Upload,
  Zap,
} from "lucide-react";
import { LandingFaq } from "@/components/landing-faq";
import { JsonLd } from "@/components/json-ld";
import { BhadaLogo } from "@/components/brand-logo";
import { ESTATE_PLAN, FREE_PLAN, PORTFOLIO_PLAN } from "@/lib/plans";
import { landingLanguageNames, landingPaths, type LandingCopy, type LandingLocale } from "@/lib/landing-copy";
import { SITE_ALTERNATE_NAME, SITE_NAME, SITE_URL } from "@/lib/seo";

const capabilityIcons = [MessageCircle, Receipt, ReceiptText];
const featureIcons = [MessageCircle, QrCode, ReceiptText, Receipt, Zap, Upload];
const reasonIcons = [Receipt, Gauge, Layers];

function structuredData(copy: LandingCopy, locale: LandingLocale) {
  const url = `${SITE_URL}${landingPaths[locale] === "/" ? "/" : landingPaths[locale]}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: copy.meta.description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: copy.htmlLang,
      },
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: SITE_NAME,
        alternateName: [SITE_ALTERNATE_NAME, "Bhadaa Rent Tracker"],
        url,
        inLanguage: copy.htmlLang,
        description: copy.meta.description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any device with a modern web browser",
        featureList: copy.features.items.map((item) => item.title),
        offers: [
          { "@type": "Offer", name: FREE_PLAN.name, price: "0", priceCurrency: "INR", url: `${url}#pricing` },
          { "@type": "Offer", name: `${PORTFOLIO_PLAN.name} (monthly)`, price: String(PORTFOLIO_PLAN.monthlyPrice), priceCurrency: "INR", url: `${url}#pricing` },
          { "@type": "Offer", name: `${PORTFOLIO_PLAN.name} (yearly)`, price: String(PORTFOLIO_PLAN.yearlyPrice), priceCurrency: "INR", url: `${url}#pricing` },
          { "@type": "Offer", name: ESTATE_PLAN.name, price: String(ESTATE_PLAN.monthlyPrice), priceCurrency: "INR", url: `${url}#pricing` },
        ],
        provider: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        inLanguage: copy.htmlLang,
        mainEntity: copy.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}

function LanguageLinks({ locale, className }: { locale: LandingLocale; className?: string }) {
  return (
    <nav aria-label="Language" className={className}>
      {(Object.keys(landingPaths) as LandingLocale[]).map((item) => (
        <Link
          key={item}
          href={landingPaths[item]}
          hrefLang={item}
          aria-current={item === locale ? "page" : undefined}
          className={item === locale ? "text-[#E4C77A]" : "text-white/45 transition hover:text-white"}
        >
          {landingLanguageNames[item]}
        </Link>
      ))}
    </nav>
  );
}

function PlanFeatures({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 space-y-3.5 text-sm text-white/65">
      {items.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <Check className="mt-0.5 size-4 shrink-0 text-[#E4C77A]" />
          {feature}
        </li>
      ))}
    </ul>
  );
}

export function LandingPage({ copy, locale }: { copy: LandingCopy; locale: LandingLocale }) {
  const primaryHref = "/sign-in";
  const mockRows = [
    { name: "Unit 2A", tenant: "R. Mehta", amount: "₹18,500", status: copy.mockCollect.paid, tone: "paid" },
    { name: "Unit 3B", tenant: "S. Iyer", amount: "₹24,850", status: copy.mockCollect.due, tone: "due" },
    { name: "Unit 4D", tenant: "P. Nair", amount: "₹19,200", status: copy.mockCollect.overdue, tone: "late" },
    { name: "Unit 1C", tenant: "A. Khanna", amount: "₹21,000", status: copy.mockCollect.paid, tone: "paid" },
  ] as const;

  return (
    // data-i18n-ignore: each language is its own page, so the dashboard's
    // client-side translator must not rewrite this text.
    <main lang={copy.htmlLang} data-i18n-ignore className="min-h-screen overflow-x-clip bg-[#111111] font-sans text-[#EDEDE8] selection:bg-[#E4C77A] selection:text-[#111111]">
      <JsonLd data={structuredData(copy, locale)} />
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-20 bg-[#EDEDE8] px-4 py-2 text-sm font-semibold text-[#111111] transition focus:translate-y-0"
      >
        {copy.nav.skip}
      </a>
      <div className="h-px w-full bg-linear-to-r from-transparent via-[#E4C77A]/50 to-transparent" />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-5 py-5 sm:px-10 sm:py-6 lg:px-[72px]">
          <Link href={landingPaths[locale]} className="flex items-center gap-2.5" aria-label="Bhadaa home">
            <BhadaLogo className="gap-3" markClassName="size-8 text-[#EDEDE8]" wordmarkClassName="text-lg text-[#EDEDE8]" />
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-10 text-xs tracking-[0.5px] text-white/55 uppercase lg:flex">
            <a href="#features" className="transition hover:text-white">{copy.nav.features}</a>
            <a href="#how-it-works" className="transition hover:text-white">{copy.nav.how}</a>
            <a href="#pricing" className="transition hover:text-white">{copy.nav.pricing}</a>
            <a href="#faq" className="transition hover:text-white">{copy.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <LanguageLinks locale={locale} className="hidden gap-3 text-xs md:flex" />
            <Link href="/sign-in" className="hidden text-xs tracking-[0.5px] text-white/55 uppercase transition hover:text-white sm:block">
              {copy.nav.signIn}
            </Link>
            <Link
              href={primaryHref}
              className="border border-white/30 px-4 py-2.5 text-[11px] font-semibold tracking-[0.5px] uppercase transition hover:border-white/60 hover:bg-white/[0.04] sm:px-5 sm:text-xs"
            >
              {copy.nav.startFree}
            </Link>
          </div>
        </div>
        <LanguageLinks locale={locale} className="flex justify-center gap-5 border-t border-white/10 py-2.5 text-xs md:hidden" />
      </header>

      {/* HERO */}
      <section id="main-content" className="relative scroll-mt-8 overflow-hidden border-b border-white/10 px-5 pt-16 pb-14 sm:px-10 sm:pt-24 sm:pb-20 lg:px-[72px] lg:pt-[124px] lg:pb-24">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-[#E4C77A]/[0.06] blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 size-[28rem] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1296px] items-end gap-10 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,1fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="mb-6 text-[11px] font-semibold tracking-[2px] text-[#E4C77A] uppercase sm:mb-7 sm:text-xs">{copy.hero.eyebrow}</p>
            <h1 className="max-w-[900px] font-display text-[clamp(2.5rem,10.5vw,5.5rem)] leading-[1.08] tracking-[-1px] lg:tracking-[-1.5px]">
              {copy.hero.line1}
              <br />
              {copy.hero.line2}
            </h1>
          </div>
          <div className="max-w-md pb-1 lg:pb-2">
            <p className="mb-8 text-[15px] leading-7 text-white/60 sm:text-[17px]">{copy.hero.subtitle}</p>
            <Link href={primaryHref} className="group inline-flex min-h-12 items-center gap-2 bg-[#EDEDE8] px-7 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-white">
              {copy.hero.cta} <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-0.5" />
            </Link>
            <div className="mt-7 grid gap-2 text-xs text-white/45 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {copy.hero.bullets.map((item) => (
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
          {copy.capabilities.map((capability, index) => {
            const Icon = capabilityIcons[index];
            return (
              <div
                key={capability.value}
                className={`group px-5 py-9 transition duration-300 hover:bg-white/[0.02] sm:px-8 sm:py-11 lg:px-12 ${index < 2 ? "border-b border-white/10 sm:border-r sm:border-b-0" : ""}`}
              >
                <span className="mb-6 grid size-10 place-items-center border border-white/15 text-[#E4C77A] transition duration-300 group-hover:border-[#E4C77A]/50 group-hover:bg-[#E4C77A]/5">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-[34px]">{capability.value}</h2>
                <p className="mt-2 text-[11px] leading-5 tracking-[0.8px] text-white/45 uppercase">{capability.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="scroll-mt-8 border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto max-w-[1296px]">
          <div className="mb-14 grid gap-6 sm:mb-16 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-5 text-[11px] font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">{copy.features.eyebrow}</p>
              <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-[-0.5px] sm:text-4xl lg:text-[44px]">{copy.features.title}</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-white/50 sm:text-[15px] sm:leading-7 lg:justify-self-end">{copy.features.desc}</p>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {copy.features.items.map(({ title, desc }, index) => {
              const Icon = featureIcons[index] ?? FileText;
              return (
                <article key={title} className="group flex min-h-[240px] flex-col bg-[#111111] p-7 transition duration-300 hover:bg-white/[0.025] sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center border border-white/15 text-[#E4C77A] transition duration-300 group-hover:border-[#E4C77A]/50 group-hover:bg-[#E4C77A]/5">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-display text-sm text-white/20 transition duration-300 group-hover:text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-auto pt-10">
                    <h3 className="font-display text-xl leading-snug sm:text-[22px]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/50">{desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* APP MOCKUPS */}
      <div id="how-it-works" className="scroll-mt-8 border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto grid max-w-[1296px] grid-cols-1 gap-px bg-white/10 lg:grid-cols-2">
          <article className="flex h-full flex-col bg-[#111111] p-7 sm:p-11">
            <div className="mb-1.5 font-display text-xl sm:text-2xl">{copy.mockCollect.title}</div>
            <div className="mb-8 text-sm text-white/50 sm:mb-9">{copy.mockCollect.sub}</div>
            <div className="flex flex-1 flex-col overflow-hidden border border-white/15 bg-linear-to-b from-white/[0.025] to-transparent">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                <div className="text-xs tracking-[1px] text-white/50 uppercase">{copy.mockCollect.header}</div>
                <div className="font-display text-xl sm:text-2xl">₹83,550</div>
              </div>
              {mockRows.map((row) => (
                <div key={row.name} className="flex flex-1 items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{row.name}</div>
                    <div className="mt-0.5 text-xs text-white/40">{row.tenant}</div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-sm">{row.amount}</div>
                    {row.tone === "paid" ? (
                      <div className="w-[88px] text-right text-[11px] tracking-[0.5px] text-white/40">{row.status}</div>
                    ) : (
                      <div className={`flex w-[88px] items-center justify-center gap-1 border py-1.5 text-[11px] ${row.tone === "late" ? "border-[#C96A4E]/60 text-[#df8a70]" : "border-[#E4C77A]/50 text-[#E4C77A]"}`}>
                        <MessageCircle className="size-3" /> {copy.mockCollect.remind}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="flex h-full flex-col bg-[#111111] p-7 sm:p-11">
            <div className="mb-1.5 font-display text-xl sm:text-2xl">{copy.mockBill.title}</div>
            <div className="mb-8 text-sm text-white/50 sm:mb-9">{copy.mockBill.sub}</div>
            <div className="flex flex-1 flex-col border border-white/15 bg-linear-to-b from-white/[0.025] to-transparent p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <div className="font-display text-base sm:text-[17px]">Bill #RB-2607-014</div>
                  <div className="mt-1 text-xs text-white/40">Sunrise Apartments · Unit 3B</div>
                </div>
                <div className="text-[11px] tracking-[0.5px] text-[#E4C77A]">05 JUL</div>
              </div>
              <div className="border-t border-white/10 pt-4">
                {[[copy.mockBill.rent, "₹20,000"], [copy.mockBill.electricity, "₹2,400"], ["GST", "₹2,240"], ["TDS", "−₹200"]].map(([label, amount]) => (
                  <div key={label} className="flex justify-between py-1.5 text-[13px] text-white/65">
                    <div>{label}</div>
                    <div>{amount}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-white/15 pt-4">
                <div className="text-xs tracking-[1px] text-white/50 uppercase">{copy.mockBill.total}</div>
                <div className="font-display text-2xl">₹24,440</div>
              </div>
              <div className="mt-auto flex items-center gap-4 pt-6">
                <div className="grid size-16 shrink-0 place-items-center bg-white text-[#111]">
                  <QrCode className="size-12" strokeWidth={1.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-center gap-2 bg-[#E4C77A] py-3 text-[13px] font-semibold text-[#111]">
                    {copy.mockBill.pay}
                  </div>
                  <p className="mt-2 text-center text-[11px] text-white/40">{copy.mockBill.scan}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* WHY IT WORKS */}
      <div className="border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto max-w-[1296px]">
          <div className="mb-14 font-display text-3xl sm:mb-16 sm:text-4xl lg:text-[44px]">{copy.reasons.title}</div>
          <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-3">
            {copy.reasons.items.map(({ title, desc }, index) => {
              const Icon = reasonIcons[index];
              return (
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
              );
            })}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-8 border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">{copy.pricing.eyebrow}</p>
            <h2 className="mt-5 font-display text-3xl leading-tight tracking-[-0.5px] sm:text-4xl lg:text-[44px]">{copy.pricing.title}</h2>
            <p className="mt-5 text-sm leading-6 text-white/50 sm:text-[15px] sm:leading-7">{copy.pricing.desc}</p>
          </div>

          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">
            <article className="flex flex-col bg-[#111111] p-7 sm:p-9">
              <p className="text-xs font-semibold tracking-[1px] text-white/45 uppercase">{copy.pricing.free.label}</p>
              <h3 className="mt-4 font-display text-3xl">{FREE_PLAN.name}</h3>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-5xl">₹0</span>
                <span className="pb-1.5 text-sm text-white/40">{copy.pricing.free.per}</span>
              </div>
              <p className="mt-5 min-h-12 text-sm leading-6 text-white/50">{copy.pricing.free.desc}</p>
              <PlanFeatures items={copy.pricing.free.features} />
              <Link href={primaryHref} className="mt-10 inline-flex min-h-12 items-center justify-center border border-white/25 px-6 text-sm font-semibold transition hover:border-white/50 hover:bg-white/[0.04]">
                {copy.pricing.free.cta}
              </Link>
            </article>

            <article className="relative flex flex-col bg-[#171717] p-7 sm:p-9">
              <p className="text-xs font-semibold tracking-[1px] text-[#E4C77A] uppercase">{copy.pricing.portfolio.label}</p>
              <h3 className="mt-4 font-display text-3xl">{PORTFOLIO_PLAN.name}</h3>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-5xl">₹{PORTFOLIO_PLAN.monthlyPrice}</span>
                <span className="pb-1.5 text-sm text-white/40">{copy.pricing.portfolio.per}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#E4C77A]">{copy.pricing.portfolio.yearly}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-white/50">{copy.pricing.portfolio.desc}</p>
              <PlanFeatures items={copy.pricing.portfolio.features} />
              <Link href="/sign-in" className="mt-10 inline-flex min-h-12 items-center justify-center bg-[#EDEDE8] px-6 text-sm font-semibold text-[#111111] transition hover:bg-white">
                {copy.pricing.portfolio.cta}
              </Link>
            </article>

            <article className="flex flex-col bg-[#111111] p-7 sm:p-9">
              <p className="text-xs font-semibold tracking-[1px] text-white/45 uppercase">{copy.pricing.estate.label}</p>
              <h3 className="mt-4 font-display text-3xl">{ESTATE_PLAN.name}</h3>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-5xl">₹{ESTATE_PLAN.monthlyPrice}</span>
                <span className="pb-1.5 text-sm text-white/40">{copy.pricing.estate.per}</span>
              </div>
              <p className="mt-5 min-h-12 text-sm leading-6 text-white/50">{copy.pricing.estate.desc}</p>
              <PlanFeatures items={copy.pricing.estate.features} />
              <Link href="/sign-in" className="mt-10 inline-flex min-h-12 items-center justify-center border border-white/25 px-6 text-sm font-semibold transition hover:border-white/50 hover:bg-white/[0.04]">
                {copy.pricing.estate.cta}
              </Link>
            </article>
          </div>
          <p className="mt-6 text-center text-xs text-white/40">{copy.pricing.note}</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-8 border-b border-white/10 px-5 py-20 sm:px-10 sm:py-24 lg:px-[72px] lg:py-[112px]">
        <div className="mx-auto grid max-w-[1296px] gap-12 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)] lg:gap-24">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <span className="mb-6 grid size-10 place-items-center border border-white/15 text-[#E4C77A]">
              <HelpCircle className="size-[18px]" />
            </span>
            <p className="text-[11px] font-semibold tracking-[1.8px] text-[#E4C77A] uppercase">{copy.faqSection.eyebrow}</p>
            <h2 className="mt-5 max-w-md font-display text-3xl leading-tight sm:text-4xl lg:text-[44px]">{copy.faqSection.title}</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/50 sm:text-[15px] sm:leading-7">{copy.faqSection.desc}</p>
          </div>
          <div>
            <LandingFaq faqs={copy.faqs} />
            <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
              <p className="max-w-md text-sm leading-6 text-white/50">{copy.faqSection.ready}</p>
              <Link href={primaryHref} className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#E4C77A] transition hover:text-[#f0da9d]">
                {copy.hero.cta}
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
          <div className="mx-auto mb-6 max-w-2xl font-display text-4xl tracking-[-1px] sm:text-5xl lg:text-[56px]">{copy.cta.title}</div>
          <div className="mb-10 text-base text-white/55 sm:text-[17px]">{copy.cta.sub}</div>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/45">
            {copy.cta.bullets.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-[#E4C77A]" /> {item}
              </span>
            ))}
          </div>
          <Link href={primaryHref} className="group inline-flex items-center gap-2 bg-[#EDEDE8] px-9 py-[18px] text-sm font-semibold text-[#111111] transition hover:bg-white">
            {copy.hero.cta} <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-0.5" />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/40">
            <ShieldCheck className="size-3.5 text-[#E4C77A]" /> {copy.cta.privacy}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="px-5 py-16 sm:px-10 sm:py-20 lg:px-[72px]">
        <div className="mx-auto max-w-[1296px]">
          <div className="grid gap-12 sm:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <BhadaLogo markClassName="size-6 text-[#EDEDE8]" wordmarkClassName="text-lg text-[#EDEDE8]" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">{copy.footer.blurb}</p>
              <LanguageLinks locale={locale} className="mt-6 flex gap-4 text-sm" />
            </div>
            <div>
              <div className="mb-5 text-xs tracking-[1px] text-white/40 uppercase">{copy.footer.product}</div>
              <div className="flex flex-col gap-3.5 text-sm text-white/60">
                <a href="#features" className="transition hover:text-white">{copy.nav.features}</a>
                <a href="#how-it-works" className="transition hover:text-white">{copy.nav.how}</a>
                <Link href="/rent-management-software" className="transition hover:text-white">{copy.footer.rentSoftware}</Link>
                <Link href="/rent-tracking" className="transition hover:text-white">{copy.footer.rentTracking}</Link>
                <a href="#faq" className="transition hover:text-white">{copy.nav.faq}</a>
              </div>
            </div>
            <div>
              <div className="mb-5 text-xs tracking-[1px] text-white/40 uppercase">{copy.footer.account}</div>
              <div className="flex flex-col gap-3.5 text-sm text-white/60">
                <Link href="/sign-in" className="transition hover:text-white">{copy.nav.signIn}</Link>
                <Link href={primaryHref} className="transition hover:text-white">{copy.hero.cta}</Link>
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row">
            <div>{copy.footer.copyright}</div>
            <div>{copy.footer.built}</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
