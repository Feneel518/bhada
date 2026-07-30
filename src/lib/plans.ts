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
};

export function hasPortfolioAccess(account: PlanAccount, now = new Date()) {
  if (account.plan !== "portfolio") return false;
  if (account.subscriptionCancelAtPeriodEnd && account.subscriptionCurrentPeriodEnd) {
    return account.subscriptionCurrentPeriodEnd.getTime() > now.getTime();
  }
  if (["authenticated", "active"].includes(account.subscriptionStatus ?? "")) return true;

  return account.subscriptionStatus === "pending"
    && Boolean(account.subscriptionCurrentPeriodEnd)
    && account.subscriptionCurrentPeriodEnd!.getTime() > now.getTime();
}

export function planLimits(account: PlanAccount) {
  return hasPortfolioAccess(account) ? PORTFOLIO_PLAN : FREE_PLAN;
}
