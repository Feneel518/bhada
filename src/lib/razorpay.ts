import "server-only";

import { BILLING_CHOICES, type BillingChoice, type PaidPlan } from "@/lib/plans";

const API_BASE = "https://api.razorpay.com/v1";

export type RazorpaySubscription = {
  id: string;
  plan_id: string;
  status: string;
  current_end: number | null;
  has_scheduled_changes?: boolean;
  change_scheduled_at?: number | null;
  notes?: Record<string, string> | [];
};

export type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
  created_at: number;
};

// One Razorpay plan per billing choice. Only the Portfolio monthly plan is
// required; the others appear at checkout once their plan IDs are set.
const planEnv: Record<BillingChoice, string> = {
  portfolio_monthly: "RAZORPAY_PORTFOLIO_PLAN_ID",
  portfolio_yearly: "RAZORPAY_PORTFOLIO_YEARLY_PLAN_ID",
  estate_monthly: "RAZORPAY_ESTATE_PLAN_ID",
};

export function razorpayPlanIds() {
  return Object.fromEntries(
    (Object.keys(planEnv) as BillingChoice[])
      .map((choice) => [choice, process.env[planEnv[choice]]?.trim()])
      .filter(([, id]) => Boolean(id)),
  ) as Partial<Record<BillingChoice, string>>;
}

export function availableBillingChoices() {
  return Object.keys(razorpayPlanIds()) as BillingChoice[];
}

export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const planIdsByChoice = razorpayPlanIds();
  const planId = planIdsByChoice.portfolio_monthly;

  if (!keyId || !keySecret || !planId) {
    throw new Error("Razorpay billing is not configured.");
  }

  return { keyId, keySecret, planId, planIds: Object.values(planIdsByChoice), planIdsByChoice };
}

export function choiceForPlanId(planId: string): BillingChoice | null {
  const entry = Object.entries(razorpayPlanIds()).find(([, id]) => id === planId);
  return entry ? (entry[0] as BillingChoice) : null;
}

function basicAuth(keyId: string, keySecret: string) {
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`;
}

export async function razorpayRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { keyId, keySecret } = razorpayConfig();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: basicAuth(keyId, keySecret),
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as {
      error?: { description?: string };
    } | null;
    throw new Error(payload?.error?.description || `Razorpay request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export async function hmacHex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function safeEqualHex(left: string, right: string) {
  if (left.length !== right.length || !/^[a-f0-9]+$/i.test(left + right)) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function subscriptionPeriodEnd(subscription: RazorpaySubscription) {
  return subscription.current_end
    ? new Date(subscription.current_end * 1_000)
    : null;
}

export function subscriptionPlan(status: string, planId?: string): PaidPlan | "one_door" {
  if (!["authenticated", "active", "pending"].includes(status)) return "one_door";
  const choice = planId ? choiceForPlanId(planId) : null;
  return choice ? BILLING_CHOICES[choice].plan : "portfolio";
}

export function subscriptionInterval(planId: string) {
  const choice = choiceForPlanId(planId);
  return choice ? BILLING_CHOICES[choice].interval : null;
}
