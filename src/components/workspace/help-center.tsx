"use client";

import { useState } from "react";
import { Building2, ChevronDown, CreditCard, Gauge, HelpCircle, Home, Search, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const helpCenterSections = [
  {
    title: "Getting started",
    description: "Set up Bhadaa in the right order.",
    icon: Home,
    articles: [
      {
        question: "How do I set up my portfolio?",
        answer:
          "Select Set up rental on Overview to add a property, its unit and a tenant in one guided flow. Reuse an existing property or vacant unit, or keep the unit vacant. Each completed step is saved. Add extra lease, identity and tax details later using Edit tenant.",
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
          "Open Properties and select Add property to start the guided property, unit and tenant setup. Add unit on a property card starts with that property already selected. Floor, area and opening electricity meter readings can be added later using Edit unit.",
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
          "Bhadaa uses the tenant’s monthly rent and billing schedule. If enabled, GST is added and TDS is deducted using that tenant’s saved rates. Opening balances and earlier unpaid amounts remain visible in the tenant’s balance.",
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
          "A partial payment reduces the tenant’s balance while the remainder stays pending. When recorded payments exceed billed charges, Bhadaa shows the account as overpaid so the credit remains visible.",
      },
      {
        question: "Can I download or share a bill?",
        answer:
          "Yes. In Payments, open a rent or electricity bill to preview it, then choose Print, Download PDF, or Share. To print a tenant ledger, open the tenant’s financial profile and select Print ledger. If sharing is unavailable on the device, Bhadaa downloads the PDF instead.",
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
          "Open Payments and select Add electricity bill. Choose the property and unit, the exact meter reading date, current reading, rate per unit, and due date. Bhadaa uses the previous dated reading to calculate consumption and the bill amount.",
      },
      {
        question: "Why can’t I add another bill for the same date?",
        answer:
          "Each unit can have only one electricity bill per meter reading date. Check the existing electricity bills in Payments before trying again, and confirm that the selected date and unit are correct.",
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
          "Open Settings to update the landlord or business details used across the account and on generated bills. The Documents section also controls whether invoices print the tenant’s total outstanding balance. Save the form before returning to the dashboard.",
      },
      {
        question: "What appears in notifications?",
        answer:
          "Notifications highlight rent and electricity amounts that are due or overdue, upcoming lease expiries, and scheduled rent increases. Marking an item as read removes it from the unread list.",
      },
      {
        question: "How do financial years work?",
        answer:
          "Bhadaa groups billing and payment records into April–March financial years. Use the Financial year selector in Payments to load the period you want to review.",
      },
    ],
  },
] as const;

export function HelpCenter() {
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
