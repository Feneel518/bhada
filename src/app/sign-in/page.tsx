"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BhadaLogo } from "@/components/brand-logo";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfbfd]" />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() => {
    if (searchParams.get("verified") === "true") return "Email verified. Your workspace is ready.";
    if (searchParams.get("reset") === "success") return "Password updated. Sign in with your new password.";
    return "";
  });
  const [verificationEmail, setVerificationEmail] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    setLoading(true);
    setError("");
    setNotice("");

    if (isSignUp) {
      const result = await authClient.signUp.email({
        email,
        password,
        name: String(data.get("name")).trim(),
        callbackURL: "/sign-in?verified=true",
      });
      setLoading(false);
      if (result.error) {
        setError(result.error.message ?? "We couldn’t create your account. Check your details and try again.");
        return;
      }
      setVerificationEmail(email);
      return;
    }

    const result = await authClient.signIn.email({ email, password, callbackURL: "/dashboard" });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Email or password is incorrect.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError("");
    const result = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    if (result?.error) {
      setError("Google sign-in is not configured yet. Please use email and password.");
      setGoogleLoading(false);
    }
  }

  if (verificationEmail) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5">
        <div className="w-full max-w-md rounded-[26px] border border-white bg-white p-8 text-center shadow-[0_24px_80px_rgba(35,40,60,.1)]">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e9f7f2] text-[#27816b]"><MailCheck className="size-6" /></span>
          <h1 className="mt-6 font-display text-3xl tracking-[-0.045em]">Check your inbox</h1>
          <p className="mt-3 text-sm leading-6 text-[#747b8b]">We sent a verification link to <strong className="text-[#3f4553]">{verificationEmail}</strong>. Open it to activate your workspace.</p>
          <button onClick={() => { setVerificationEmail(""); setIsSignUp(false); }} className="mt-7 text-sm font-bold text-[#5555c7] hover:underline">Back to sign in</button>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#242452] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(124,124,230,.45),transparent_33%),radial-gradient(circle_at_85%_75%,rgba(70,181,160,.24),transparent_30%)]" />
        <Link href="/" className="relative flex items-center gap-3">
          <BhadaLogo
            markClassName="size-10 text-white"
            wordmarkClassName="text-2xl text-white"
          />
        </Link>
        <div className="relative my-auto max-w-lg">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#aaaaf0]">Rent, without the runaround</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.12] tracking-[-0.055em]">Your whole rental portfolio, finally in one calm place.</h1>
          <div className="mt-9 space-y-4 text-sm text-[#d9daee]">
            {["Know exactly who has paid and who needs a reminder.", "See income and occupancy without wrestling a spreadsheet.", "Keep properties, tenants, and leases connected."].map((item) => (
              <p key={item} className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-white/10"><Check className="size-3.5" /></span>{item}</p>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-[#aeb0cc]">Secure, private workspaces for independent landlords.</p>
      </section>

      <section className="flex items-center justify-center bg-[#fbfbfd] px-5 py-12">
        <div className="w-full max-w-[420px]">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#7d8493] hover:text-[#5555c7]">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <p className="text-sm font-semibold text-[#5b5bd6]">{isSignUp ? "Create your workspace" : "Welcome back"}</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-0.045em]">{isSignUp ? "Start tracking rent" : "Sign in to Bhada"}</h2>
          <p className="mt-2 text-sm text-[#7f8696]">{isSignUp ? "A clear portfolio is just a minute away." : "Enter your details to continue to your portfolio."}</p>

          {notice && <p className="mt-5 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

          <Button type="button" variant="outline" className="mt-7 h-12 w-full bg-white" onClick={signInWithGoogle} disabled={googleLoading}>
            {googleLoading ? <LoaderCircle className="size-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#a0a5b0]"><span className="h-px flex-1 bg-[#e4e6eb]" /> or use email <span className="h-px flex-1 bg-[#e4e6eb]" /></div>

          <form onSubmit={submit} className="space-y-4">
            {isSignUp && <AuthField name="name" type="text" label="Full name" placeholder="Jamie Doyle" autoComplete="name" />}
            <AuthField name="email" type="email" label="Email address" placeholder="you@example.com" autoComplete="email" />
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-bold text-[#4d5362]">
                Password
                {!isSignUp && <Link href="/forgot-password" className="font-semibold text-[#5b5bd6] hover:underline">Forgot password?</Link>}
              </span>
              <div className="relative">
                <input name="password" required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} placeholder="At least 8 characters" className="h-12 w-full rounded-xl border border-[#dfe2e9] bg-white px-4 pr-12 text-sm outline-none focus:border-[#aaaaf0] focus:ring-4 focus:ring-[#5b5bd6]/10" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a90a0]">
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
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setNotice(""); }} className="font-bold text-[#5555c7] hover:underline">
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="mt-6 text-center text-[11px] leading-5 text-[#9aa0ad]">By continuing, you agree to keep your account credentials secure.</p>
        </div>
      </section>
    </main>
  );
}

function AuthField({ name, type, label, placeholder, autoComplete }: { name: string; type: string; label: string; placeholder: string; autoComplete: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#4d5362]">{label}</span>
      <input name={name} required type={type} autoComplete={autoComplete} placeholder={placeholder} className="h-12 w-full rounded-xl border border-[#dfe2e9] bg-white px-4 text-sm outline-none focus:border-[#aaaaf0] focus:ring-4 focus:ring-[#5b5bd6]/10" />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.01 6.01 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}
