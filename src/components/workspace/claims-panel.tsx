"use client";

import { useState, useTransition } from "react";
import { CircleCheck, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { rejectPaymentClaim } from "@/app/dashboard/claims/actions";
import type { LandlordClaim } from "@/lib/tenant-portal";
import { formatCurrency } from "@/lib/utils";

const methodLabels: Record<string, string> = { upi: "UPI", bank_transfer: "Bank transfer", cash: "Cash", check: "Cheque" };

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })
    .format(new Date(`${value}T12:00:00+05:30`));
}

export function ClaimsPanel({
  claims,
  onConfirm,
}: {
  claims: LandlordClaim[];
  onConfirm: (claim: LandlordClaim) => void;
}) {
  const [rejecting, setRejecting] = useState<LandlordClaim | null>(null);
  if (!claims.length) return null;

  return (
    <section className="mt-4 overflow-hidden rounded-[20px] border border-[#e4c77a]/40 bg-[#e4c77a]/[0.05]" aria-labelledby="claims-heading">
      <div className="px-5 pb-2 pt-5 sm:px-6">
        <h2 id="claims-heading" className="font-display text-base font-bold tracking-[-0.025em]">
          Tenants say they’ve paid ({claims.length})
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Check your bank or UPI app, then confirm. Nothing changes until you do.</p>
      </div>
      <ul className="divide-y divide-border">
        {claims.map((claim) => (
          <li key={claim.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {claim.tenantName} · <span className="tabular-nums">{formatCurrency(claim.amount)}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {claim.propertyName} · Unit {claim.unitNumber} · {methodLabels[claim.method]} on {shortDate(claim.paidOn)}
                {claim.reference ? ` · Ref ${claim.reference}` : ""}
              </p>
              {claim.note && <p className="mt-1 text-xs text-muted-foreground">“{claim.note}”</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setRejecting(claim)}>
                <X data-icon="inline-start" />Not received
              </Button>
              <Button size="sm" onClick={() => onConfirm(claim)}>
                <CircleCheck data-icon="inline-start" />Confirm
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {rejecting && <RejectDialog claim={rejecting} onClose={() => setRejecting(null)} />}
    </section>
  );
}

function RejectDialog({ claim, onClose }: { claim: LandlordClaim; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await rejectPaymentClaim(claim.id, note);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="max-w-[440px]">
        <DialogTitle>Not received yet?</DialogTitle>
        <DialogDescription>
          {claim.tenantName} said they paid {formatCurrency(claim.amount)}. They’ll see your note on their page.
        </DialogDescription>
        <label className="mt-5 block text-xs font-semibold text-white/65">
          Note for the tenant (optional)
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={200}
            placeholder="e.g. Not in my account yet, please share the UPI ref"
            className="mt-2 h-11 w-full border border-white/[0.09] bg-white/[0.018] px-3.5 text-sm text-[#edede8] outline-none focus:border-white/20"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}Mark not received
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
