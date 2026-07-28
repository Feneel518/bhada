"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: String(data.get("name")) })
      : await authClient.signIn.email({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Check your details and try again.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#242452] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(124,124,230,.45),transparent_33%),radial-gradient(circle_at_85%_75%,rgba(70,181,160,.24),transparent_30%)]" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#5555c7]"><Building2 className="size-5" /></span>
          <span className="font-display text-2xl font-extrabold tracking-[-0.04em]">bhada</span>
        </div>
        <div className="relative my-auto max-w-lg">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#aaaaf0]">Rent, without the runaround</p>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.12] tracking-[-0.055em]">Your whole rental portfolio, finally in one calm place.</h1>
          <div className="mt-9 space-y-4 text-sm text-[#d9daee]">
            {["Know exactly who has paid and who needs a reminder.", "See income and occupancy without wrestling a spreadsheet.", "Keep properties, tenants, and leases connected."].map((item) => (
              <p key={item} className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-white/10"><Check className="size-3.5" /></span>{item}</p>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-[#aeb0cc]">Built for independent landlords who value their time.</p>
      </section>

      <section className="flex items-center justify-center bg-[#fbfbfd] px-5 py-12">
        <div className="w-full max-w-[420px]">
          <button onClick={() => router.push("/")} className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-[#5b5bd6] text-white"><Building2 className="size-[18px]" /></span>
            <span className="font-display text-xl font-extrabold">bhada</span>
          </button>
          <p className="text-sm font-semibold text-[#5b5bd6]">{isSignUp ? "Create your workspace" : "Welcome back"}</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.045em]">{isSignUp ? "Start tracking rent" : "Sign in to Bhada"}</h2>
          <p className="mt-2 text-sm text-[#7f8696]">{isSignUp ? "A clear portfolio is just a minute away." : "Enter your details to continue to your portfolio."}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isSignUp && <AuthField name="name" type="text" label="Full name" placeholder="Jamie Doyle" />}
            <AuthField name="email" type="email" label="Email address" placeholder="you@example.com" />
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#4d5362]">Password</span>
              <div className="relative">
                <input name="password" required minLength={8} type={showPassword ? "text" : "password"} placeholder="At least 8 characters" className="h-12 w-full rounded-xl border border-[#dfe2e9] bg-white px-4 pr-12 text-sm outline-none focus:border-[#aaaaf0] focus:ring-4 focus:ring-[#5b5bd6]/10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a90a0]">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-xs font-medium text-red-700">{error}</p>}
            <Button type="submit" className="h-12 w-full" disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <>{isSignUp ? "Create account" : "Sign in"} <ArrowRight className="size-4" /></>}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#7f8696]">
            {isSignUp ? "Already have an account?" : "New to Bhada?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="font-bold text-[#5555c7] hover:underline">
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
          <button onClick={() => router.push("/")} className="mt-5 w-full text-center text-xs font-semibold text-[#999eac] hover:text-[#5b5bd6]">Continue with demo data</button>
        </div>
      </section>
    </main>
  );
}

function AuthField({ name, type, label, placeholder }: { name: string; type: string; label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#4d5362]">{label}</span>
      <input name={name} required type={type} placeholder={placeholder} className="h-12 w-full rounded-xl border border-[#dfe2e9] bg-white px-4 text-sm outline-none focus:border-[#aaaaf0] focus:ring-4 focus:ring-[#5b5bd6]/10" />
    </label>
  );
}
