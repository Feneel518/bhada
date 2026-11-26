export const FREE_PLAN = {
  name: "One Door",
  propertyLimit: 1,
  unitLimit: 3,
} as const;

export const PORTFOLIO_PLAN = {
  name: "Portfolio",
  monthlyPrice: 49,
  yearlyPrice: 499,
  propertyLimit: 5,
  unitLimit: 25,
} as const;

// For PG, hostel and larger building owners.
export const ESTATE_PLAN = {
  name: "Estate",
  monthlyPrice: 99,
  propertyLimit: 20,
  unitLimit: 100,
} as const;

export const PAID_PLANS = ["portfolio", "estate"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];
export type PlanId = "one_door" | PaidPlan;

// Bhadaa is not GST registered, so prices are final with no GST added.
export const PRICE_NOTE = "No GST charged. Cancel anytime.";

export const BILLING_CHOICES = {
  portfolio_monthly: { plan: "portfolio", interval: "month", price: 49, label: "Portfolio · ₹49/month" },
  portfolio_yearly: { plan: "portfolio", interval: "year", price: 499, label: "Portfolio · ₹499/year" },
  estate_monthly: { plan: "estate", interval: "month", price: 99, label: "Estate · ₹99/month" },
} as const satisfies Record<string, { plan: PaidPlan; interval: "month" | "year"; price: number; label: string }>;
export type BillingChoice = keyof typeof BILLING_CHOICES;

export function isBillingChoice(value: unknown): value is BillingChoice {
  return typeof value === "string" && Object.hasOwn(BILLING_CHOICES, value);
}

export function isPaidPlan(value: unknown): value is PaidPlan {
  return (PAID_PLANS as readonly unknown[]).includes(value);
}

export type PlanAccount = {
  plan?: string | null;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: Date | null;
  subscriptionCancelAtPeriodEnd?: boolean | null;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  trialRevoked?: boolean;
};

export const TRIAL_DAYS = 7;

export type SubscriptionView = {
  active: boolean;
  /** Paid plan in effect, or "portfolio" during the trial, else "one_door". */
  plan?: PlanId;
  billingInterval?: "month" | "year" | null;
  /** Paid options with a Razorpay plan configured. */
  choices?: BillingChoice[];
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialActive: boolean;
  trialEligible: boolean;
  trialEndsAt: string | null;
};

/** Any paid plan (Portfolio or Estate) with a live billing period. */
export function hasPaidPortfolioAccess(account: PlanAccount, now = new Date()) {
  if (!isPaidPlan(account.plan)) return false;
  // Mandate authentication alone is not a paid subscription. Terminal states
  // must never be overridden by a stale cancellation flag or future date.
  return ["active", "pending"].includes(account.subscriptionStatus ?? "")
    && (account.subscriptionCurrentPeriodEnd?.getTime() ?? 0) > now.getTime();
}

export function hasTrialAccess(account: PlanAccount, now = new Date()) {
  return !account.trialRevoked
    && ["none", "created", "authenticated"].includes(account.subscriptionStatus ?? "none")
    && Boolean(account.trialStartedAt)
    && account.trialStartedAt!.getTime() <= now.getTime()
    && (account.trialEndsAt?.getTime() ?? 0) > now.getTime();
}

export function isTrialEligible(account: PlanAccount) {
  return !account.trialStartedAt && account.plan === "one_door"
    && (account.subscriptionStatus ?? "none") === "none";
}

export function hasPortfolioAccess(account: PlanAccount, now = new Date()) {
  return hasPaidPortfolioAccess(account, now) || hasTrialAccess(account, now);
}

export function planLimits(account: PlanAccount): typeof FREE_PLAN | typeof PORTFOLIO_PLAN | typeof ESTATE_PLAN {
  if (account.plan === "estate" && hasPaidPortfolioAccess(account)) return ESTATE_PLAN;
  return hasPortfolioAccess(account) ? PORTFOLIO_PLAN : FREE_PLAN;
}

export function limitsForPlan(plan: PlanId | undefined, active: boolean) {
  if (!active) return FREE_PLAN;
  return plan === "estate" ? ESTATE_PLAN : PORTFOLIO_PLAN;
}
