"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleCheck, MessageCircle, Plus, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/language-provider";
import { collectionCounts, type CollectionRow } from "@/lib/collection";
import { shareKey, type ShareLinks } from "@/lib/share-keys";
import { reminderMessage, whatsappLink, whatsappNumber, type MessageLanguage } from "@/lib/whatsapp";
import { cn, formatCurrency } from "@/lib/utils";

const REMINDED_KEY = "bhadaa-reminded";

function readReminded(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(REMINDED_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function markReminded(tenantId: string, today: string) {
  try {
    window.localStorage.setItem(REMINDED_KEY, JSON.stringify({ ...readReminded(), [tenantId]: today }));
  } catch { /* Storage can be unavailable; reminders still work. */ }
}

export function reminderLinkFor(
  row: CollectionRow,
  { landlordName, upiId, shareLinks, language }: { landlordName: string; upiId: string; shareLinks: ShareLinks; language: MessageLanguage },
) {
  const billUrl = row.bill ? shareLinks[shareKey(row.bill.kind, row.bill.record.id)] : undefined;
  return whatsappLink(row.tenant.phone, reminderMessage({
    tenantName: row.tenant.name,
    landlordName,
    amount: row.outstanding,
    dueDate: row.dueDate ?? undefined,
    overdue: row.status === "overdue",
    billUrl,
    upiId,
    language,
  }));
}

function dueLabel(row: CollectionRow) {
  if (row.status === "paid") return "All clear";
  if (!row.dueDate) return "Earlier balance";
  if (row.daysOverdue > 0) return `${row.daysOverdue} day${row.daysOverdue === 1 ? "" : "s"} late`;
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })
    .format(new Date(`${row.dueDate}T12:00:00+05:30`));
  return `Due ${date}`;
}

const statusChip: Record<CollectionRow["status"], string> = {
  overdue: "border-[#c96a4e]/40 bg-[#c96a4e]/10 text-[#df8a70]",
  due: "border-[#e4c77a]/40 bg-[#e4c77a]/10 text-[#e4c77a]",
  paid: "border-[#6f927f]/40 bg-[#6f927f]/10 text-[#9bc4ab]",
};

export function CollectionList({
  rows,
  today,
  landlordName,
  upiId,
  shareLinks,
  onMarkPaid,
  onAddRental,
  onImport,
  onAddUpi,
}: {
  rows: CollectionRow[];
  today: string;
  landlordName: string;
  upiId: string;
  shareLinks: ShareLinks;
  onMarkPaid: (row: CollectionRow) => void;
  onAddRental: () => void;
  onImport: () => void;
  onAddUpi: () => void;
}) {
  const { language } = useLanguage();
  const [reminded, setReminded] = useState<Record<string, string>>({});
  const [remindQueue, setRemindQueue] = useState<CollectionRow[] | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const counts = useMemo(() => collectionCounts(rows), [rows]);
  const overdueRows = rows.filter((row) => row.status === "overdue");
  const unpaidRows = rows.filter((row) => row.status !== "paid");
  const paidRows = rows.filter((row) => row.status === "paid");
  const visibleRows = showPaid ? rows : unpaidRows;
  const linkOptions = { landlordName, upiId, shareLinks, language };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReminded(readReminded()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function remember(tenantId: string) {
    markReminded(tenantId, today);
    setReminded((current) => ({ ...current, [tenantId]: today }));
  }

  if (!rows.length) {
    return (
      <section className="mt-4 rounded-[20px] border border-dashed border-border bg-card p-6 text-center sm:p-8" aria-label="Get started">
        <h2 className="font-display text-lg font-bold">Add your tenants to start collecting</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Bhadaa creates every month’s rent bill on its own. You just tap Remind and tenants pay by UPI.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={onAddRental}><Plus data-icon="inline-start" />Add a rental</Button>
          <Button variant="outline" onClick={onImport}><Upload data-icon="inline-start" />Import from Excel</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[20px] border border-border bg-card" aria-labelledby="collection-heading">
      <div className="flex flex-col gap-3 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 id="collection-heading" className="font-display text-base font-bold tracking-[-0.025em]">Collect rent</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {counts.overdue} overdue · {counts.due} due · {counts.paid} paid up
          </p>
        </div>
        {overdueRows.length > 0 && (
          <Button onClick={() => setRemindQueue(overdueRows)} className="w-full sm:w-auto">
            <Send data-icon="inline-start" />Remind all overdue ({overdueRows.length})
          </Button>
        )}
      </div>

      {!upiId && unpaidRows.length > 0 && (
        <button
          type="button"
          onClick={onAddUpi}
          className="mx-5 mb-3 flex w-[calc(100%-2.5rem)] items-center justify-between gap-3 border border-[#e4c77a]/25 bg-[#e4c77a]/[0.05] px-3 py-2.5 text-left text-xs text-[#e4c77a] sm:mx-6 sm:w-[calc(100%-3rem)]"
        >
          <span>Add your UPI ID so reminders include a Pay now link and QR code.</span>
          <span className="shrink-0 font-semibold underline underline-offset-2">Add UPI</span>
        </button>
      )}

      <ul className="divide-y divide-border border-t border-border">
        {visibleRows.map((row) => {
          const remindedToday = reminded[row.tenant.id] === today;
          const hasPhone = Boolean(whatsappNumber(row.tenant.phone));
          return (
            <li key={row.tenant.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-xs font-extrabold text-[#e4c77a]">
                  {row.tenant.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.tenant.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {row.tenant.propertyName} · Unit {row.tenant.unitNumber}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{row.status === "paid" ? "—" : formatCurrency(row.outstanding)}</p>
                  <span className={cn("mt-1 inline-flex border px-2 py-0.5 text-[10px] font-bold", statusChip[row.status])}>
                    {dueLabel(row)}
                  </span>
                </div>
              </div>
              {row.status !== "paid" && (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={reminderLinkFor(row, linkOptions)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => remember(row.tenant.id)}
                      title={hasPhone ? `Message ${row.tenant.name} on WhatsApp` : "No phone saved: you’ll pick the chat in WhatsApp"}
                    >
                      {remindedToday ? <Check data-icon="inline-start" /> : <MessageCircle data-icon="inline-start" />}
                      {remindedToday ? "Reminded" : "Remind"}
                    </a>
                  </Button>
                  <Button size="sm" onClick={() => onMarkPaid(row)}>
                    <CircleCheck data-icon="inline-start" />Mark paid
                  </Button>
                </div>
              )}
            </li>
          );
        })}
        {!visibleRows.length && (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">
            Everyone has paid. Nice work.
          </li>
        )}
      </ul>
      {paidRows.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPaid((current) => !current)}
          className="w-full border-t border-border py-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          {showPaid ? "Hide paid tenants" : `Show ${paidRows.length} paid tenant${paidRows.length === 1 ? "" : "s"}`}
        </button>
      )}

      {remindQueue && (
        <RemindAllDialog
          queue={remindQueue}
          linkFor={(row) => reminderLinkFor(row, linkOptions)}
          onSent={remember}
          onClose={() => setRemindQueue(null)}
        />
      )}
    </section>
  );
}

// Browsers block several WhatsApp tabs opening at once, so reminders go out one
// tap at a time. Each "Send" is a fresh click, which keeps pop-up blockers happy.
function RemindAllDialog({
  queue,
  linkFor,
  onSent,
  onClose,
}: {
  queue: CollectionRow[];
  linkFor: (row: CollectionRow) => string;
  onSent: (tenantId: string) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const row = queue[index];
  const done = index >= queue.length;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[440px]">
        <DialogTitle>{done ? "All reminders sent" : `Remind ${index + 1} of ${queue.length}`}</DialogTitle>
        <DialogDescription>
          {done
            ? "Tenants get a link to their bill with a UPI Pay now button."
            : "WhatsApp opens with the message ready. Press send there, then come back for the next one."}
        </DialogDescription>
        {done ? (
          <div className="mt-6 flex justify-end"><Button onClick={onClose}>Done</Button></div>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-between gap-3 border border-border p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.tenant.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.tenant.propertyName} · Unit {row.tenant.unitNumber}</p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(row.outstanding)}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setIndex((current) => current + 1)}>Skip</Button>
              <Button asChild>
                <a
                  href={linkFor(row)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { onSent(row.tenant.id); setIndex((current) => current + 1); }}
                >
                  <MessageCircle data-icon="inline-start" />Send on WhatsApp
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
