"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { approveMeterReading, rejectMeterReading, type ElectricityBillActionState } from "@/app/dashboard/electricity/actions";
import type { PendingMeterReading } from "@/lib/meter-readings";
import { formatCurrency } from "@/lib/utils";

const number = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 3 });

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })
    .format(new Date(`${value}T12:00:00+05:30`));
}

export function MeterReadingsPanel({
  readings,
  onEdit,
  sendHref,
}: {
  readings: PendingMeterReading[];
  onEdit: (reading: PendingMeterReading) => void;
  sendHref: (bill: NonNullable<ElectricityBillActionState["bill"]>) => string | null;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingMeterReading | null>(null);
  const [, startTransition] = useTransition();
  if (!readings.length) return null;

  function approve(reading: PendingMeterReading) {
    setBusyId(reading.id);
    startTransition(async () => {
      const result = await approveMeterReading(reading.id);
      setBusyId(null);
      if (result.status !== "success") {
        toast.error(result.message);
        return;
      }
      const href = result.bill ? sendHref(result.bill) : null;
      toast.success(`Bill created for ${reading.tenantName}`, {
        description: href ? "It's on their page. Send it on WhatsApp too?" : result.message,
        duration: href ? 12_000 : undefined,
        action: href ? { label: "Send to tenant", onClick: () => window.open(href, "_blank", "noopener,noreferrer") } : undefined,
      });
    });
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[20px] border border-[#9aa9c4]/35 bg-[#9aa9c4]/[0.05]" aria-labelledby="meter-heading">
      <div className="px-5 pb-2 pt-5 sm:px-6">
        <h2 id="meter-heading" className="font-display text-base font-bold tracking-[-0.025em]">
          Meter readings from tenants ({readings.length})
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Approve to create the electricity bill. It’s due 7 days after the reading.</p>
      </div>
      <ul className="divide-y divide-border">
        {readings.map((reading) => {
          const units = reading.previousReading === null ? null : reading.reading - reading.previousReading;
          const looksWrong = units !== null && units < 0;
          return (
            <li key={reading.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {reading.tenantName}
                  {units !== null && reading.rate && !looksWrong && (
                    <> · <span className="tabular-nums">{formatCurrency(units * reading.rate)}</span></>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {reading.propertyName} · Unit {reading.unitNumber} · {shortDate(reading.readingDate)}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {reading.previousReading === null ? "No previous reading" : number(reading.previousReading)} → {number(reading.reading)}
                  {units !== null && !looksWrong && ` = ${number(units)} units`}
                  {reading.rate ? ` × ${formatCurrency(reading.rate)}` : " · no rate set"}
                </p>
                {looksWrong && <p className="mt-1 text-xs text-[#df8a70]">Lower than the last reading. Check it before billing.</p>}
                {reading.note && <p className="mt-1 text-xs text-muted-foreground">“{reading.note}”</p>}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setRejecting(reading)}>
                  <X data-icon="inline-start" />Not right
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(reading)}>
                  <Pencil data-icon="inline-start" />Edit
                </Button>
                {reading.rate && !looksWrong ? (
                  <Button size="sm" onClick={() => approve(reading)} disabled={busyId === reading.id}>
                    {busyId === reading.id ? <LoaderCircle className="animate-spin" /> : <Check data-icon="inline-start" />}Approve
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onEdit(reading)}>
                    <Check data-icon="inline-start" />{reading.rate ? "Fix & bill" : "Add rate & bill"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {rejecting && <RejectReadingDialog reading={rejecting} onClose={() => setRejecting(null)} />}
    </section>
  );
}

function RejectReadingDialog({ reading, onClose }: { reading: PendingMeterReading; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  function submit() {
    startTransition(async () => {
      const result = await rejectMeterReading(reading.id, note);
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
        <DialogTitle>Send the reading back?</DialogTitle>
        <DialogDescription>{reading.tenantName} will see your note and can enter the reading again.</DialogDescription>
        <label className="mt-5 block text-xs font-semibold text-white/65">
          Note for the tenant (optional)
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={200}
            placeholder="e.g. Please send a photo of the meter"
            className="mt-2 h-11 w-full border border-white/[0.09] bg-white/[0.018] px-3.5 text-sm text-[#edede8] outline-none focus:border-white/20"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Send back</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
