import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  Check,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { auth } from "@/lib/auth";

const benefits = [
  {
    icon: WalletCards,
    title: "Rent tracking that stays current",
    copy: "See paid, pending, and overdue rent at a glance. No spreadsheet archaeology required.",
    tone: "bg-[#eeefff] text-[#5656c9]",
  },
  {
    icon: Users,
    title: "Every tenant, lease, and unit",
    copy: "Keep the details connected, searchable, and ready whenever you need them.",
    tone: "bg-[#e7f6f1] text-[#277c68]",
  },
  {
    icon: BellRing,
    title: "Less chasing, more clarity",
    copy: "Know what needs attention today and keep your rental operation moving.",
    tone: "bg-[#fff0e5] text-[#b96d37]",
  },
];

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const primaryHref = session ? "/dashboard" : "/sign-in";
  const primaryLabel = session ? "Open dashboard" : "Start for free";

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfbfd] text-[#202635]">
      <nav className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Bhada home">
          <Logo />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#6e7585] md:flex">
          <a href="#features" className="transition hover:text-[#4f4fc2]">Features</a>
          <a href="#how-it-works" className="transition hover:text-[#4f4fc2]">How it works</a>
          <a href="#security" className="transition hover:text-[#4f4fc2]">Security</a>
        </div>
        <div className="flex items-center gap-2">
          {!session && (
            <Link href="/sign-in" className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-[#515767] transition hover:bg-white sm:block">
              Sign in
            </Link>
          )}
          <Link href={primaryHref} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5656ce] px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200/70 transition hover:-translate-y-0.5 hover:bg-[#4949bd]">
            {primaryLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
      </nav>

      <section className="relative">
        <div className="absolute left-[-12rem] top-20 size-[28rem] rounded-full bg-[#e7e7ff] blur-3xl" />
        <div className="absolute right-[-14rem] top-[-5rem] size-[32rem] rounded-full bg-[#e8f8f3] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[.92fr_1.08fr] lg:pb-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#deddfa] bg-white/80 px-3.5 py-2 text-xs font-bold text-[#5656c6] shadow-sm backdrop-blur">
              <Sparkles className="size-3.5" /> Built for independent landlords
            </div>
            <h1 className="mt-7 font-display text-5xl leading-[1.08] tracking-[-0.06em] text-[#202635] sm:text-6xl lg:text-[68px]">
              Rent management, without the runaround.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f7687]">
              Bhada brings your properties, tenants, leases, and payments into one calm workspace—so you always know what&apos;s happening and what comes next.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref} className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#5656ce] px-6 text-sm font-bold text-white shadow-xl shadow-indigo-200/70 transition hover:-translate-y-0.5 hover:bg-[#4949bd]">
                {primaryLabel} <ArrowRight className="size-4" />
              </Link>
              <a href="#features" className="inline-flex h-13 items-center justify-center rounded-xl border border-[#dfe2e9] bg-white px-6 text-sm font-bold text-[#4f5666] transition hover:border-[#c9c9ef] hover:text-[#4e4ec0]">
                See how it works
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#7a8191]">
              {["Free to get started", "Setup in minutes", "Your data stays yours"].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check className="size-3.5 text-[#45a185]" /> {item}</span>
              ))}
            </div>
          </div>

          <HeroDashboard />
        </div>
      </section>

      <section id="features" className="border-y border-[#ebecef] bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#5959cb]">Everything in one place</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] sm:text-5xl">A clearer view of every rental.</h2>
            <p className="mt-5 text-base leading-7 text-[#747b8b]">Built around the work you do every month, without the clutter of software made for giant property companies.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, copy, tone }) => (
              <article key={title} className="rounded-[24px] border border-[#e8e9ee] bg-[#fdfdfe] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(35,40,55,.07)]">
                <span className={`grid size-12 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></span>
                <h3 className="mt-6 font-display text-xl tracking-[-0.035em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#777e8e]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#5959cb]">Quietly powerful</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] sm:text-5xl">Your month, under control.</h2>
            <p className="mt-5 text-base leading-7 text-[#747b8b]">Start with a property, connect its tenants, and let Bhada give you a useful picture of rent collection from day one.</p>
            <Link href={primaryHref} className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#5353c6] hover:underline">
              Build your workspace <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Add your properties", "Bring buildings and units into one tidy portfolio."],
              ["02", "Connect tenants", "Keep lease and contact details close at hand."],
              ["03", "Track every payment", "See collection progress and follow up with confidence."],
            ].map(([number, title, copy]) => (
              <div key={number} className="rounded-[22px] bg-[#272752] p-6 text-white">
                <span className="text-xs font-black text-[#aaaaf0]">{number}</span>
                <h3 className="mt-12 font-display text-lg">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#c9cadb]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[30px] bg-[#eeefff] px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div className="absolute right-[-5rem] top-[-8rem] size-72 rounded-full border-[42px] border-white/35" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-bold text-[#5151bb]"><ShieldCheck className="size-5" /> Private by design</div>
            <h2 className="mt-4 font-display text-3xl tracking-[-0.045em]">Your dashboard belongs only to you.</h2>
            <p className="mt-4 leading-7 text-[#686e83]">Secure sessions, verified email accounts, and user-scoped portfolio data keep each workspace separate.</p>
          </div>
          <Link href={primaryHref} className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#252550] px-5 text-sm font-bold text-white lg:mt-0">
            {primaryLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#e8e9ed] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-[#838998] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <p>© 2026 Bhada. Rent, without the runaround.</p>
        </div>
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <>
      <span className="grid size-10 place-items-center rounded-xl bg-[#5656ce] text-white shadow-md shadow-indigo-200"><Building2 className="size-5" /></span>
      <span className="font-display text-xl tracking-[-0.045em] text-[#202635]">bhada</span>
    </>
  );
}

function HeroDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[650px]">
      <div className="absolute -inset-6 rounded-[34px] bg-gradient-to-br from-[#dcdcff] to-[#dff5ee] opacity-70 blur-2xl" />
      <div className="relative overflow-hidden rounded-[26px] border border-white bg-[#f6f7fb] shadow-[0_32px_90px_rgba(44,48,75,.18)]">
        <div className="flex h-14 items-center border-b border-[#e8e9ef] bg-white px-5">
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#ff8d79]" /><span className="size-2.5 rounded-full bg-[#ffc76b]" /><span className="size-2.5 rounded-full bg-[#64c59f]" /></div>
          <div className="mx-auto h-7 w-44 rounded-lg bg-[#f4f4f8]" />
        </div>
        <div className="grid grid-cols-[74px_1fr] sm:grid-cols-[150px_1fr]">
          <div className="border-r border-[#e8e9ef] bg-white p-3 sm:p-4">
            <div className="mb-8 flex items-center gap-2 text-[#5555c7]"><Building2 className="size-5" /><span className="hidden text-xs font-black sm:block">BHADA</span></div>
            {[BarChart3, Building2, Users, FileCheck2].map((Icon, index) => <div key={index} className={`mb-2 flex h-9 items-center gap-2 rounded-lg px-2 ${index === 0 ? "bg-[#efeffd] text-[#5555c7]" : "text-[#a3a8b5]"}`}><Icon className="size-4" /><span className="hidden text-[9px] font-bold sm:block">{["Overview", "Properties", "Tenants", "Documents"][index]}</span></div>)}
          </div>
          <div className="min-w-0 p-4 sm:p-6">
            <p className="text-[9px] font-semibold text-[#9197a5]">Tuesday, July 28</p>
            <h3 className="mt-1 font-display text-lg tracking-[-0.04em] sm:text-xl">Good evening, Jamie</h3>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[["Monthly income", "$16,845", "#eeeeff"], ["Collected", "$14,905", "#e8f6f1"], ["Outstanding", "$1,940", "#fff1e3"], ["Occupancy", "83.3%", "#f9eaf0"]].map(([label, value, color]) => (
                <div key={label} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                  <span className="block size-5 rounded-md" style={{ background: color }} />
                  <p className="mt-3 text-[8px] text-[#9298a5]">{label}</p>
                  <p className="mt-0.5 text-xs font-extrabold text-[#343947] sm:text-sm">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-white p-4">
              <div className="flex justify-between"><span className="text-[9px] font-bold">Income overview</span><span className="text-[7px] text-[#989dab]">This year</span></div>
              <svg viewBox="0 0 420 105" className="mt-3 w-full" aria-hidden="true">
                <defs><linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6969df" stopOpacity=".24" /><stop offset="1" stopColor="#6969df" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 88 C45 78 54 70 90 73 S135 52 170 57 S220 42 250 48 S302 22 330 30 S375 16 420 18 L420 105 L0 105Z" fill="url(#heroFill)" />
                <path d="M0 88 C45 78 54 70 90 73 S135 52 170 57 S220 42 250 48 S302 22 330 30 S375 16 420 18" fill="none" stroke="#5b5bd6" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
