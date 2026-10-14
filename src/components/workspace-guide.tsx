"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, Clock3, CreditCard, Download, HelpCircle, LoaderCircle, LockKeyhole, Smartphone, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { startPortfolioTrial } from "@/app/dashboard/trial/actions";
import { PORTFOLIO_PLAN, TRIAL_DAYS, type SubscriptionView } from "@/lib/plans";

const steps = [
  { title: "Your rentals. A little simpler.", description: "A refreshed Bhada, made for your phone. Your properties, tenants and payment history are right where you left them.", icon: Smartphone },
  { title: "Everything has a place", description: "Use the bottom tabs to move between your overview, properties, tenants and payments. More opens your settings and help.", icon: Building2 },
  { title: "Keep rent moving", description: "Record a payment from Overview. Open a tenant to see their balance, then preview, download or share their bills.", icon: CreditCard },
  { title: "Room for your next rental", description: "Portfolio gives you space for 5 properties and 25 units, plus CSV exports for your records.", icon: Download },
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function WorkspaceGuide({ userId, subscription, hasLockedRentals, onPlan, showOffer }: {
  userId: string;
  subscription: SubscriptionView;
  hasLockedRentals: boolean;
  onPlan: () => void;
  showOffer: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const storageKey = `bhada:workspace-tour:v2:${userId}`;

  useEffect(() => {
    let frame = 0;
    try { if (!localStorage.getItem(storageKey)) frame = requestAnimationFrame(() => setOpen(true)); }
    catch { frame = requestAnimationFrame(() => setOpen(true)); }
    return () => cancelAnimationFrame(frame);
  }, [storageKey]);

  useEffect(() => {
    // Revalidate when returning from checkout/another tab and at expiry. The
    // server independently enforces access on every mutation and export.
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", refresh);
    const expires = subscription.trialActive ? subscription.trialEndsAt : subscription.active ? subscription.currentPeriodEnd : null;
    const remaining = expires ? new Date(expires).getTime() - Date.now() : -1;
    const timer = remaining >= 0 ? window.setTimeout(() => router.refresh(), Math.min(remaining + 1000, 2_147_483_647)) : undefined;
    return () => { document.removeEventListener("visibilitychange", refresh); window.clearTimeout(timer); };
  }, [router, subscription.active, subscription.currentPeriodEnd, subscription.trialActive, subscription.trialEndsAt]);

  function close() {
    try { localStorage.setItem(storageKey, "seen"); } catch { /* Private browsing still allows dismissal. */ }
    setOpen(false);
  }

  function startTrial() {
    startTransition(async () => {
      try {
        const result = await startPortfolioTrial();
        if (result.ok) { toast.success(result.message); close(); }
        else toast.error(result.message);
      } catch {
        toast.error("Couldn't reach Bhada. Check your connection and try again.");
      }
    });
  }

  const item = steps[step];
  const Icon = item.icon;
  const expired = !subscription.active && Boolean(subscription.trialEndsAt);
  return (
    <>
      <div className="workspace-guide-bar">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline">{subscription.trialActive ? "Portfolio trial" : subscription.active ? "Portfolio" : "One Door · Free"}</Badge>
          {subscription.trialActive && subscription.trialEndsAt ? <span>Until {dateLabel(subscription.trialEndsAt)}</span> : <span className="hidden sm:inline">{subscription.active ? "5 properties / 25 units" : "1 property / 3 units"}</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setStep(0); setOpen(true); }}><HelpCircle data-icon="inline-start" />Quick tour</Button>
      </div>

      {(hasLockedRentals || expired || (subscription.trialEligible && showOffer) || (subscription.active && subscription.cancelAtPeriodEnd)) && (
        <Alert className="workspace-plan-alert mb-5">
          {hasLockedRentals ? <LockKeyhole /> : <Clock3 />}
          <AlertTitle>{hasLockedRentals ? "Some rentals are now read-only" : expired ? "Your Portfolio trial has ended" : subscription.cancelAtPeriodEnd ? "Your downgrade is scheduled" : "Try a little more room"}</AlertTitle>
          <AlertDescription>
            <p>{hasLockedRentals ? "Your oldest property and its first 3 units stay available on One Door. Extra rentals and their history are saved; upgrade to edit them or create new bills." : expired ? "You're back on One Door. Your saved records are safe. Upgrade whenever you need more space or CSV exports." : subscription.cancelAtPeriodEnd ? `Portfolio access ends ${subscription.currentPeriodEnd ? dateLabel(subscription.currentPeriodEnd) : "at the end of your billing period"}. You'll return to One Door automatically.` : `Try Portfolio free for ${TRIAL_DAYS} days. No card, no automatic charge.`}</p>
            <Button variant="outline" size="sm" onClick={subscription.trialEligible ? startTrial : onPlan} disabled={pending}>
              {pending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              {subscription.trialEligible ? `Start ${TRIAL_DAYS}-day free trial` : "View my plan"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}>
        <DialogContent className="workspace-tour">
          <Badge variant="secondary">A fresh look for Bhada</Badge>
          <div className="tour-illustration" aria-hidden="true"><Icon strokeWidth={1.25} /></div>
          <div aria-live="polite">
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>{item.description}</DialogDescription>
          </div>
          <div className="tour-details">
            {step === 0 && <><Check /><p>Your records are saved.<br /><span>Pick up exactly where you left off.</span></p></>}
            {step === 1 && <><Users /><p>Find a tenant in seconds.<br /><span>Search by name, property or unit.</span></p></>}
            {step === 2 && <><CreditCard /><p>One clear view of rent.<br /><span>See what is collected and what is pending.</span></p></>}
            {step === 3 && <><Clock3 /><p>{subscription.trialEligible ? `${TRIAL_DAYS} days free. No card needed.` : subscription.trialActive ? "Your trial is already active." : subscription.active ? "You're already on Portfolio." : "Continue with One Door for free."}<br /><span>{subscription.trialEligible ? `After the trial, return to One Door or choose Portfolio at ₹${PORTFOLIO_PLAN.monthlyPrice}/month. Extra rentals become read-only.` : "Manage your subscription in Settings → Plan."}</span></p></>}
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground" aria-label={`Step ${step + 1} of ${steps.length}`}>{step + 1} / {steps.length}</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={step ? () => setStep(step - 1) : close}>{step ? "Back" : "Skip tour"}</Button>
              {step < steps.length - 1 ? <Button onClick={() => setStep(step + 1)}>Next<ArrowRight data-icon="inline-end" /></Button> : <Button onClick={subscription.trialEligible ? startTrial : close} disabled={pending}>{pending && <LoaderCircle data-icon="inline-start" className="animate-spin" />}{subscription.trialEligible ? "Start free trial" : "Let's get started"}</Button>}
            </div>
          </div>
          {step === 3 && subscription.trialEligible && <Button variant="ghost" onClick={close} disabled={pending}>Continue with free plan</Button>}
        </DialogContent>
      </Dialog>
    </>
  );
}
