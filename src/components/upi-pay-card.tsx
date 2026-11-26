"use client";

import { useEffect, useState } from "react";
import { Copy, Smartphone } from "lucide-react";
import { upiQrDataUrl } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";

export function UpiPayCard({
  link,
  upiId,
  amount,
  tone = "paper",
}: {
  link: string;
  upiId: string;
  amount: number;
  tone?: "paper" | "dark";
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    upiQrDataUrl(link).then((url) => { if (active) setQr(url); }).catch(() => undefined);
    return () => { active = false; };
  }, [link]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* Clipboard can be blocked; the ID stays visible. */ }
  }

  const dark = tone === "dark";
  return (
    <section
      aria-label="Pay by UPI"
      className={dark
        ? "flex items-center gap-4 border border-[#e4c77a]/25 bg-[#e4c77a]/[0.05] p-4"
        : "flex items-center gap-4 border border-black/80 p-3 sm:p-4"}
    >
      <div className={dark ? "size-24 shrink-0 bg-white p-1" : "size-24 shrink-0 bg-white p-1 sm:size-28"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
        {qr ? <img src={qr} alt={`UPI QR code to pay ${formatCurrency(amount)}`} className="size-full" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={dark ? "text-[10px] font-bold uppercase tracking-[0.14em] text-[#e4c77a]" : "text-[10px] font-bold uppercase tracking-[0.14em]"}>
          Pay by UPI
        </p>
        <p className={dark ? "mt-1 text-lg font-semibold text-[#edede8]" : "mt-1 text-lg font-semibold"}>{formatCurrency(amount)}</p>
        <button
          type="button"
          onClick={copy}
          className={dark ? "mt-1 inline-flex max-w-full items-center gap-1.5 text-xs text-white/55 hover:text-[#e4c77a]" : "mt-1 inline-flex max-w-full items-center gap-1.5 text-xs text-black/60 hover:text-black"}
        >
          <span className="truncate">{upiId}</span>
          <Copy className="size-3 shrink-0" />
          <span className="sr-only">Copy UPI ID</span>
          {copied && <span className="shrink-0 font-semibold">Copied</span>}
        </button>
        <a
          href={link}
          className={dark
            ? "mt-3 inline-flex h-10 items-center gap-2 bg-[#e4c77a] px-4 text-sm font-semibold text-[#111] sm:hidden"
            : "mt-3 inline-flex h-10 items-center gap-2 bg-black px-4 text-sm font-semibold text-white sm:hidden"}
        >
          <Smartphone className="size-4" /> Pay now
        </a>
        <p className={dark ? "mt-2 hidden text-[11px] text-white/35 sm:block" : "mt-2 hidden text-[11px] text-black/50 sm:block"}>
          Scan with Google Pay, PhonePe, Paytm or any UPI app.
        </p>
      </div>
    </section>
  );
}
