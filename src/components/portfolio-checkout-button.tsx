"use client";

import Script from "next/script";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
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
          const result = await verifyResponse.json() as { message?: string };
          if (!verifyResponse.ok) {
            toast.error(result.message || "Payment verification failed.");
            setPending(false);
            return;
          }

          toast.success("Portfolio activated", { description: result.message });
          window.location.assign("/dashboard?billing=success");
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
      toast.error("Couldn’t open checkout", {
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
    </>
  );
}
