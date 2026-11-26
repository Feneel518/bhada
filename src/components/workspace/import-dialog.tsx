"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Download, FileUp, LoaderCircle, MessageCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { saveProperty } from "@/app/dashboard/properties/actions";
import { saveUnit } from "@/app/dashboard/units/actions";
import { saveTenant } from "@/app/dashboard/tenants/actions";
import type { PropertyRecord } from "@/lib/properties";
import { IMPORT_COLUMNS, parseRentalSheet, templateCsv, type ImportRow } from "@/lib/rental-import";
import { formatCurrency } from "@/lib/utils";

const idle = { status: "idle" as const, message: "" };
const supportWhatsApp = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");

export function conciergeLink() {
  if (!supportWhatsApp) return null;
  const text = "Hi Bhadaa team, please set up my rentals. I'm sending a photo of my rent register.";
  return `https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(text)}`;
}

type Progress = { done: number; total: number; failures: { line: number; message: string }[] };

export function ImportDialog({
  properties,
  onClose,
}: {
  properties: PropertyRecord[];
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const rows = useMemo(() => parseRentalSheet(text), [text]);
  const validRows = rows.filter((row) => !row.error);
  const invalidRows = rows.filter((row) => row.error);
  const concierge = conciergeLink();

  function downloadTemplate() {
    const blob = new Blob([templateCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bhadaa-rentals-template.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function readFile(file: File) {
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      toast.error("Save the sheet as CSV first, or copy the cells and paste them here.");
      return;
    }
    setText(await file.text());
  }

  async function runImport() {
    setRunning(true);
    const failures: Progress["failures"] = [];
    setProgress({ done: 0, total: validRows.length, failures });
    // Reuse the same server actions as the forms, so plan limits, duplicate
    // checks and validation behave exactly as they do one-by-one.
    const propertyIds = new Map(properties.map((item) => [item.name.trim().toLowerCase(), item.id]));
    const unitIds = new Map<string, { id: string; occupied: boolean }>(properties.flatMap((item) =>
      item.units.map((unit): [string, { id: string; occupied: boolean }] => [
        `${item.id}::${unit.unitNumber.trim().toLowerCase()}`,
        { id: unit.id, occupied: Boolean(unit.tenant) },
      ]),
    ));

    let stop = false;
    for (const [index, row] of validRows.entries()) {
      if (stop) break;
      const fail = (message: string) => { failures.push({ line: row.line, message }); };
      try {
        const propertyKey = row.property.trim().toLowerCase();
        let propertyId = propertyIds.get(propertyKey);
        if (!propertyId) {
          const data = new FormData();
          data.set("name", row.property);
          const result = await saveProperty(idle, data);
          if (result.status === "error" || !result.id) {
            fail(result.message);
            if (/plan|limit|includes up to/i.test(result.message)) stop = true;
            continue;
          }
          propertyId = result.id;
          propertyIds.set(propertyKey, propertyId);
        }

        const unitKey = `${propertyId}::${row.unit.trim().toLowerCase()}`;
        let unit = unitIds.get(unitKey);
        if (!unit) {
          const data = new FormData();
          data.set("propertyId", propertyId);
          data.set("unitNumber", row.unit);
          data.set("status", "vacant");
          const result = await saveUnit(idle, data);
          if (result.status === "error" || !result.id) {
            fail(result.message);
            if (/plan|limit|includes up to/i.test(result.message)) stop = true;
            continue;
          }
          unit = { id: result.id, occupied: false };
          unitIds.set(unitKey, unit);
        }

        if (row.tenant) {
          if (unit.occupied) {
            fail(`Unit ${row.unit} already has a tenant.`);
          } else {
            const data = new FormData();
            data.set("unitId", unit.id);
            data.set("name", row.tenant);
            data.set("phone", row.phone);
            data.set("monthlyRent", row.rent ? String(row.rent) : "");
            data.set("rentBillingDay", "1");
            data.set("rentDueDay", String(row.dueDay));
            data.set("securityDeposit", row.deposit ? String(row.deposit) : "");
            data.set("openingBalance", row.openingBalance ? String(row.openingBalance) : "0");
            data.set("isActive", "on");
            const result = await saveTenant(idle, data);
            if (result.status === "error") {
              const detail = Object.values(result.errors ?? {}).filter(Boolean)[0];
              fail(detail ? `${result.message} ${detail}` : result.message);
            } else {
              unit.occupied = true;
            }
          }
        }
      } catch {
        fail("Couldn’t save this row. Check your connection.");
      }
      setProgress({ done: index + 1, total: validRows.length, failures: [...failures] });
    }

    setRunning(false);
    setProgress((current) => current && { ...current, failures: [...failures] });
    const saved = validRows.length - failures.length;
    if (saved > 0) toast.success(`Imported ${saved} row${saved === 1 ? "" : "s"}`);
  }

  const finished = progress && !running;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !running) onClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-[860px] overflow-y-auto">
        <DialogTitle>Import rentals from Excel</DialogTitle>
        <DialogDescription>
          Copy your rows in Excel or Google Sheets and paste them below. Properties, units and tenants are created in one go.
        </DialogDescription>

        {!progress && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Columns, in this order or with these headings:</span>
              {IMPORT_COLUMNS.map((column, index) => (
                <span key={column} className="border border-border px-2 py-1">{column}{index > 3 ? " (optional)" : ""}</span>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={"Shanti Residency\t101\tAarav Mehta\t9876543210\t15000\t5\nShanti Residency\t102\tPriya Shah\t9898989898\t14000\t5"}
              aria-label="Paste rows from Excel or Google Sheets"
              className="mt-3 min-h-40 w-full resize-y border border-border bg-transparent p-3 font-mono text-xs outline-none focus:border-[#e4c77a]/60"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <FileUp data-icon="inline-start" />Upload CSV
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.tsv,.txt,text/csv"
                className="hidden"
                onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); event.target.value = ""; }}
              />
              <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download data-icon="inline-start" />Download template
              </Button>
              {concierge && (
                <Button asChild variant="ghost" size="sm">
                  <a href={concierge} target="_blank" rel="noopener noreferrer">
                    <MessageCircle data-icon="inline-start" />Rather not type? WhatsApp us a photo
                  </a>
                </Button>
              )}
            </div>

            {rows.length > 0 && (
              <div className="mt-5 overflow-x-auto border border-border">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      <th className="px-3 py-2">Property</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Tenant</th>
                      <th className="px-3 py-2">Phone</th><th className="px-3 py-2">Rent</th><th className="px-3 py-2">Due</th><th className="px-3 py-2">Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 200).map((row) => <PreviewRow key={row.line} row={row} />)}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {progress && (
          <div className="mt-6 space-y-4" aria-live="polite">
            <div className="h-1.5 overflow-hidden bg-border">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
            </div>
            <p className="text-sm">
              {running ? `Saving ${progress.done} of ${progress.total}…` : `Done: ${progress.total - progress.failures.length} of ${progress.total} rows saved.`}
            </p>
            {progress.failures.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto border border-[#c96a4e]/30 bg-[#c96a4e]/[0.06] p-3 text-xs text-[#df8a70]">
                {progress.failures.map((failure, index) => (
                  <li key={`${failure.line}-${index}`}>Row {failure.line}: {failure.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {!progress && rows.length > 0 && `${validRows.length} ready${invalidRows.length ? ` · ${invalidRows.length} need fixing (they’ll be skipped)` : ""}`}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={running}>{finished ? "Close" : "Cancel"}</Button>
            {!progress && (
              <Button type="button" onClick={runImport} disabled={!validRows.length}>
                <Check data-icon="inline-start" />Import {validRows.length || ""} row{validRows.length === 1 ? "" : "s"}
              </Button>
            )}
            {running && <Button disabled><LoaderCircle className="animate-spin" />Importing</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewRow({ row }: { row: ImportRow }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="max-w-40 truncate px-3 py-2">{row.property}</td>
      <td className="px-3 py-2">{row.unit}</td>
      <td className="max-w-40 truncate px-3 py-2">{row.tenant || <span className="text-muted-foreground">Vacant</span>}</td>
      <td className="px-3 py-2">{row.phone}</td>
      <td className="px-3 py-2 tabular-nums">{row.rent ? formatCurrency(row.rent) : ""}</td>
      <td className="px-3 py-2">{row.tenant ? row.dueDay : ""}</td>
      <td className="px-3 py-2">
        {row.error
          ? <span className="inline-flex items-center gap-1 text-[#df8a70]"><TriangleAlert className="size-3.5" />{row.error}</span>
          : <span className="inline-flex items-center gap-1 text-[#9bc4ab]"><Check className="size-3.5" />OK</span>}
      </td>
    </tr>
  );
}
