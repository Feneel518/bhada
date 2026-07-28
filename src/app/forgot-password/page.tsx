"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    const result = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "We couldn’t send the reset email. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e9f7f2] text-[#27816b]"><MailCheck className="size-6" /></span>
          <h1 className="mt-5 font-display text-3xl tracking-[-0.045em]">Check your inbox</h1>
          <p className="mt-3 text-sm leading-6 text-[#747b8b]">If an account exists for that email, a secure password reset link is on its way.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-[#5b5bd6]">Password reset</p>
          <h1 className="mt-2 font-display text-3xl tracking-[-0.045em]">Let&apos;s get you back in.</h1>
          <p className="mt-3 text-sm leading-6 text-[#747b8b]">Enter the email connected to your Bhada account.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#4d5362]">Email address</span>
              <input required name="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-12 w-full rounded-xl border border-[#dfe2e9] px-4 text-sm outline-none focus:border-[#aaaaf0] focus:ring-4 focus:ring-[#5b5bd6]/10" />
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-xs text-red-700">{error}</p>}
            <Button className="h-12 w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <>Send reset link <ArrowRight className="size-4" /></>}</Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
