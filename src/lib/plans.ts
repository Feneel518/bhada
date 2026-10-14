export const FREE_PLAN = {
  name: "One Door",
  propertyLimit: 1,
  unitLimit: 3,
} as const;

export const PORTFOLIO_PLAN = {
  name: "Portfolio",
  monthlyPrice: 49,
  propertyLimit: 5,
  unitLimit: 25,
} as const;

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
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialActive: boolean;
  trialEligible: boolean;
  trialEndsAt: string | null;
};

export function hasPaidPortfolioAccess(account: PlanAccount, now = new Date()) {
  if (account.plan !== "portfolio") return false;
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

export function planLimits(account: PlanAccount) {
  return hasPortfolioAccess(account) ? PORTFOLIO_PLAN : FREE_PLAN;
}
