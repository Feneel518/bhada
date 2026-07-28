"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fc]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const invalid = !token || Boolean(searchParams.get("error"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirmPassword"))) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "This reset link is invalid or has expired.");
      return;
    }
    router.replace("/sign-in?reset=success");
  }

  return (
    <AuthShell>
      {invalid ? (
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-[-0.045em]">This link has expired</h1>
          <p className="mt-3 text-sm leading-6 text-[#747b8b]">Request a fresh password reset email to continue.</p>
          <Button className="mt-7" onClick={() => router.push("/forgot-password")}>Request a new link</Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-[#5b5bd6]">Choose a new password</p>
          <h1 className="mt-2 font-display text-3xl tracking-[-0.045em]">Make it strong.</h1>
          <p className="mt-3 text-sm leading-6 text-[#747b8b]">Use at least eight characters and avoid passwords you use elsewhere.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <PasswordField name="password" label="New password" />
            <PasswordField name="confirmPassword" label="Confirm new password" />
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-xs text-red-700">{error}</p>}
            <Button className="h-12 w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <>Update password <ArrowRight className="size-4" /></>}</Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

function PasswordField({ name, label }: { name: string; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#4d5362]">{label}</span>
      <input required minLength={8} name={name} type="password" autoComplete="new-password" className="h-12 w-full rounded-xl border border-[#dfe2e9] px-4 text-sm outline-none focus:border-[#aaaaf0] focus:ring-4 focus:ring-[#5b5bd6]/10" />
    </label>
  );
}
