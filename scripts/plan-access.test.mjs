import assert from "node:assert/strict";
import test from "node:test";
import { FREE_PLAN, PORTFOLIO_PLAN, hasPaidPortfolioAccess, hasPortfolioAccess, hasTrialAccess, isTrialEligible, planLimits } from "../src/lib/plans.ts";

const now = new Date("2026-10-14T10:00:00Z");
const future = new Date("2026-10-15T10:00:00Z");
const past = new Date("2026-10-13T10:00:00Z");
const paid = { plan: "portfolio", subscriptionStatus: "active", subscriptionCurrentPeriodEnd: future };

test("paid access ends at the exact boundary even if a renewal webhook is missing", () => {
  for (const subscriptionStatus of ["active", "pending"]) {
    assert.equal(hasPortfolioAccess({ ...paid, subscriptionStatus }, now), true);
    for (const end of [past, now, null, new Date("invalid")]) {
      assert.equal(hasPortfolioAccess({ ...paid, subscriptionStatus, subscriptionCurrentPeriodEnd: end }, now), false);
    }
  }
});

test("cancellation flags cannot grant access to terminal or unpaid statuses", () => {
  for (const subscriptionStatus of ["none", "created", "authenticated", "cancelled", "expired", "completed", "halted", "paused", "unknown"]) {
    assert.equal(hasPortfolioAccess({ ...paid, subscriptionStatus, subscriptionCancelAtPeriodEnd: true }, now), false, subscriptionStatus);
  }
  assert.equal(hasPortfolioAccess({ ...paid, subscriptionCancelAtPeriodEnd: true }, now), true);
  assert.equal(hasPortfolioAccess({ ...paid, plan: "one_door" }, now), false);
});

test("trial is time bounded and does not resurrect a cancelled or expired paid account", () => {
  const trial = { plan: "one_door", subscriptionStatus: "none", trialStartedAt: past, trialEndsAt: future };
  assert.equal(hasPortfolioAccess(trial, now), true);
  assert.equal(hasPaidPortfolioAccess(trial, now), false);
  assert.equal(hasTrialAccess(trial, future), false);
  assert.equal(hasTrialAccess({ ...trial, trialStartedAt: future }, now), false);
  assert.equal(hasTrialAccess({ ...trial, trialStartedAt: null }, now), false);
  for (const subscriptionStatus of ["active", "pending", "halted", "paused", "cancelled", "completed", "expired"]) {
    assert.equal(hasPortfolioAccess({ ...trial, subscriptionStatus }, now), false, subscriptionStatus);
  }
});

test("trial eligibility is single-use and excludes previously subscribed accounts", () => {
  assert.equal(isTrialEligible({ plan: "one_door", subscriptionStatus: "none" }), true);
  assert.equal(isTrialEligible({ plan: "one_door", subscriptionStatus: "none", trialStartedAt: past, trialEndsAt: now }), false);
  for (const subscriptionStatus of ["cancelled", "completed", "expired", "halted", "authenticated", "active", "pending"]) {
    assert.equal(isTrialEligible({ plan: "one_door", subscriptionStatus }), false);
  }
});

test("every caller receives free limits after expiry and paid limits during a trial", () => {
  assert.deepEqual(planLimits({ ...paid, subscriptionCurrentPeriodEnd: past }), FREE_PLAN);
  assert.deepEqual(planLimits({ plan: "one_door", subscriptionStatus: "none", trialStartedAt: new Date(Date.now() - 1000), trialEndsAt: new Date(Date.now() + 60000) }), PORTFOLIO_PLAN);
});
