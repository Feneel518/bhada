"use client";

import Script from "next/script";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadSubscriptionReceiptPdf } from "@/lib/subscription-receipt-pdf";
import { cn } from "@/lib/utils";

type CheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type PaymentReceipt = {
  receiptNumber: string;
  paymentId: string;
  subscriptionId: string;
  amountPaise: number;
  currency: string;
  status: string;
  paidAt: string;
  customerName: string;
  customerEmail: string;
  description: string;
};

type RazorpayCheckout = {
  open(): void;
  on(event: "payment.failed", handler: (response: {
    error?: { description?: string };
  }) => void): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

export function PortfolioCheckoutButton({
  className,
  active = false,
}: {
  className?: string;
  active?: boolean;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [downloadPending, setDownloadPending] = useState(false);

  function continueToDashboard() {
    window.location.assign("/dashboard?billing=success");
  }

  async function downloadReceipt() {
    if (!receipt) return;

    setDownloadPending(true);
    try {
      await downloadSubscriptionReceiptPdf(receipt);
    } catch {
      toast.error("Could not download the receipt. Please try again.");
    } finally {
      setDownloadPending(false);
    }
  }

  async function beginCheckout() {
    if (active) {
      window.location.assign("/dashboard");
      return;
    }
    const Razorpay = window.Razorpay;
    if (!scriptReady || !Razorpay) {
      toast.error("Secure checkout is still loading. Please try again.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/billing/razorpay/subscription", {
        method: "POST",
      });
      const data = await response.json() as {
        message?: string;
        keyId?: string;
        subscriptionId?: string;
        name?: string;
        email?: string;
        contact?: string;
      };
      if (!response.ok || !data.keyId || !data.subscriptionId) {
        throw new Error(data.message || "Unable to start checkout.");
      }

      const checkout = new Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Bhada",
        description: "Portfolio plan · ₹49/month",
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.contact,
        },
        theme: { color: "#E4C77A" },
        handler: async (payment: CheckoutResponse) => {
          const verifyResponse = await fetch("/api/billing/razorpay/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payment),
          });
          const result = await verifyResponse.json() as {
            message?: string;
            receipt?: PaymentReceipt;
          };
          if (!verifyResponse.ok || !result.receipt) {
            toast.error(result.message || "Payment verification failed.");
            setPending(false);
            return;
          }

          toast.success("Portfolio activated", { description: result.message });
          setPending(false);
          setReceipt(result.receipt);
        },
        modal: {
          ondismiss: () => setPending(false),
        },
      });
      checkout.on("payment.failed", (failure) => {
        toast.error("Payment failed", {
          description: failure.error?.description || "Please try again.",
        });
        setPending(false);
      });
      checkout.open();
    } catch (error) {
      toast.error("Couldn't open checkout", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setPending(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => toast.error("Unable to load Razorpay Checkout.")}
      />
      <button
        type="button"
        onClick={beginCheckout}
        disabled={pending}
        className={cn(className, pending && "cursor-wait opacity-70")}
      >
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        {active ? "Open Portfolio dashboard" : pending ? "Opening secure checkout…" : "Upgrade to Portfolio"}
      </button>

      <Dialog
        open={Boolean(receipt)}
        onOpenChange={(open) => {
          if (!open && receipt) continueToDashboard();
        }}
      >
        <DialogContent tone="light" className="max-w-[460px] overflow-hidden border-[#deddd8] bg-[#f7f6f2] p-0 text-[#252933]">
          {receipt && (
            <>
              <div className="border-b border-[#e7e2d4] bg-white px-6 pb-6 pt-7 text-center">
                <span className="mx-auto grid size-12 place-items-center border border-[#e4c77a] bg-[#fcfaf3] text-[#24231f]">
                  <CheckCircle2 className="size-7" strokeWidth={2.2} />
                </span>
                <DialogTitle className="mt-4 text-2xl text-[#222630]">Payment received</DialogTitle>
                <DialogDescription className="text-[#777b84]">
                  Your Portfolio plan is active. Here is your receipt.
                </DialogDescription>
              </div>

              <div className="p-6">
                <div className="border border-[#deddd8] bg-white px-5 py-5">
                  <div className="flex items-end justify-between border-b border-dashed border-[#dfe1e5] pb-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999eaa]">
                        Amount paid
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold tracking-[-0.04em] text-[#222630]">
                        ₹{(receipt.amountPaise / 100).toFixed(2)}
                      </p>
                    </div>
                    <span className="border border-[#86b9a7] bg-[#f3faf7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#27816b]">
                      {receipt.status}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 text-xs">
                    <ReceiptRow label="Plan" value="Portfolio · Monthly" />
                    <ReceiptRow
                      label="Paid on"
                      value={new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Kolkata",
                      }).format(new Date(receipt.paidAt))}
                    />
                    <ReceiptRow label="Receipt no." value={receipt.receiptNumber} />
                    <ReceiptRow label="Payment ID" value={receipt.paymentId} />
                    <ReceiptRow label="Paid by" value={receipt.customerEmail} />
                  </dl>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={downloadReceipt}
                    disabled={downloadPending}
                    className="flex h-11 items-center justify-center gap-2 border border-[#d9d8d3] bg-white px-4 text-sm font-bold text-[#343946] transition hover:border-[#b8b6af] disabled:cursor-wait disabled:opacity-65"
                  >
                    {downloadPending
                      ? <LoaderCircle className="size-4 animate-spin" />
                      : <Download className="size-4" />}
                    {downloadPending ? "Preparing..." : "Download receipt"}
                  </button>
                  <button
                    type="button"
                    onClick={continueToDashboard}
                    className="flex h-11 items-center justify-center gap-2 bg-[#181818] px-4 text-sm font-bold text-white transition hover:bg-[#2a2a2a]"
                  >
                    Continue to dashboard
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-[#8c929f]">{label}</dt>
      <dd className="min-w-0 break-all text-right font-semibold text-[#424754]">{value}</dd>
    </div>
  );
}
