import "server-only";

import { eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  landlord,
  property,
  saasBillingEvent,
  session,
  tenant,
  unit,
  user,
} from "@/db/schema";
import { hasPortfolioAccess, PORTFOLIO_PLAN } from "@/lib/plans";

const CHURN_STATUSES = new Set(["cancelled", "completed", "expired", "halted"]);
const CHURN_EVENTS = new Set([
  "subscription.cancelled",
  "subscription.completed",
  "subscription.expired",
  "subscription.halted",
]);

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function percent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

export async function getOwnerAnalytics(now = new Date()) {
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = addMonths(currentMonthStart, -1);
  const seriesStart = addMonths(currentMonthStart, -11);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000);

  const [
    accounts,
    billingEvents,
    recentSessions,
    propertyRows,
    unitRows,
    tenantRows,
  ] = await Promise.all([
    db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        userCreatedAt: user.createdAt,
        landlordId: landlord.id,
        businessName: landlord.businessName,
        plan: landlord.plan,
        subscriptionStatus: landlord.subscriptionStatus,
        subscriptionCurrentPeriodEnd: landlord.subscriptionCurrentPeriodEnd,
        subscriptionCancelAtPeriodEnd: landlord.subscriptionCancelAtPeriodEnd,
        subscriptionUpdatedAt: landlord.updatedAt,
      })
      .from(user)
      .leftJoin(landlord, eq(landlord.userId, user.id)),
    db
      .select()
      .from(saasBillingEvent)
      .where(gte(saasBillingEvent.occurredAt, seriesStart)),
    db
      .select({ userId: session.userId })
      .from(session)
      .where(gte(session.updatedAt, thirtyDaysAgo)),
    db.select({ landlordId: property.landlordId }).from(property),
    db.select({ landlordId: unit.landlordId }).from(unit),
    db
      .select({ landlordId: tenant.landlordId, isActive: tenant.isActive })
      .from(tenant),
  ]);

  // The owner also uses Bhada as a real landlord workspace, so the account
  // belongs in product adoption and customer totals.
  const customers = accounts;
  const customerUserIds = new Set(customers.map((account) => account.userId));
  const customerLandlordIds = new Set(
    customers.flatMap((account) => account.landlordId ? [account.landlordId] : []),
  );
  const payingCustomers = customers.filter((account) => hasPortfolioAccess(account, now));
  const payingLandlordIds = new Set(
    payingCustomers.flatMap((account) => account.landlordId ? [account.landlordId] : []),
  );
  const freeCustomers = customers.filter((account) => !hasPortfolioAccess(account, now));
  const currentMonthSignups = customers.filter(
    (account) => account.userCreatedAt >= currentMonthStart,
  );
  const previousMonthSignups = customers.filter(
    (account) =>
      account.userCreatedAt >= previousMonthStart
      && account.userCreatedAt < currentMonthStart,
  );
  const newLast30Days = customers.filter(
    (account) => account.userCreatedAt >= thirtyDaysAgo,
  );

  const churnedLandlords = new Set<string>();
  for (const event of billingEvents) {
    if (
      event.landlordId
      && customerLandlordIds.has(event.landlordId)
      && CHURN_EVENTS.has(event.eventType)
      && event.occurredAt >= thirtyDaysAgo
    ) {
      churnedLandlords.add(event.landlordId);
    }
  }
  for (const account of customers) {
    if (
      account.landlordId
      && CHURN_STATUSES.has(account.subscriptionStatus ?? "")
      && account.subscriptionUpdatedAt
      && account.subscriptionUpdatedAt >= thirtyDaysAgo
    ) {
      churnedLandlords.add(account.landlordId);
    }
  }

  const revenueEvents = billingEvents.filter(
    (event) =>
      event.eventType === "payment.captured"
      && event.amountPaise > 0
      && Boolean(event.landlordId && customerLandlordIds.has(event.landlordId)),
  );
  const realizedRevenue = revenueEvents.reduce(
    (total, event) => total + event.amountPaise / 100,
    0,
  );
  const realizedRevenueThisMonth = revenueEvents
    .filter((event) => event.occurredAt >= currentMonthStart)
    .reduce((total, event) => total + event.amountPaise / 100, 0);
  const mrr = payingCustomers.length * PORTFOLIO_PLAN.monthlyPrice;
  const activeUserIds = new Set(
    recentSessions
      .map((record) => record.userId)
      .filter((userId) => customerUserIds.has(userId)),
  );

  const propertiesByLandlord = new Map<string, number>();
  const unitsByLandlord = new Map<string, number>();
  const tenantsByLandlord = new Map<string, number>();
  const activeTenantsByLandlord = new Map<string, number>();
  for (const row of propertyRows) {
    if (customerLandlordIds.has(row.landlordId)) {
      propertiesByLandlord.set(row.landlordId, (propertiesByLandlord.get(row.landlordId) ?? 0) + 1);
    }
  }
  for (const row of unitRows) {
    if (customerLandlordIds.has(row.landlordId)) {
      unitsByLandlord.set(row.landlordId, (unitsByLandlord.get(row.landlordId) ?? 0) + 1);
    }
  }
  for (const row of tenantRows) {
    if (customerLandlordIds.has(row.landlordId)) {
      tenantsByLandlord.set(row.landlordId, (tenantsByLandlord.get(row.landlordId) ?? 0) + 1);
      if (row.isActive) {
        activeTenantsByLandlord.set(
          row.landlordId,
          (activeTenantsByLandlord.get(row.landlordId) ?? 0) + 1,
        );
      }
    }
  }

  const months = Array.from({ length: 12 }, (_, index) => {
    const start = addMonths(seriesStart, index);
    return {
      key: monthKey(start),
      label: start.toLocaleDateString("en-IN", { month: "short" }),
      signups: 0,
      revenue: 0,
      churned: new Set<string>(),
    };
  });
  const monthMap = new Map(months.map((month) => [month.key, month]));
  for (const account of customers) {
    const month = monthMap.get(monthKey(account.userCreatedAt));
    if (month) month.signups += 1;
  }
  for (const event of revenueEvents) {
    const month = monthMap.get(monthKey(event.occurredAt));
    if (month) month.revenue += event.amountPaise / 100;
  }
  for (const event of billingEvents) {
    if (event.landlordId && CHURN_EVENTS.has(event.eventType)) {
      monthMap.get(monthKey(event.occurredAt))?.churned.add(event.landlordId);
    }
  }

  const totalProperties = Array.from(propertiesByLandlord.values()).reduce((a, b) => a + b, 0);
  const totalUnits = Array.from(unitsByLandlord.values()).reduce((a, b) => a + b, 0);
  const totalTenants = Array.from(tenantsByLandlord.values()).reduce((a, b) => a + b, 0);
  const activeTenants = Array.from(activeTenantsByLandlord.values()).reduce((a, b) => a + b, 0);
  const activatedAccounts = customers.filter(
    (account) => account.landlordId && (propertiesByLandlord.get(account.landlordId) ?? 0) > 0,
  ).length;

  const recentAccounts = [...customers]
    .sort((left, right) => right.userCreatedAt.getTime() - left.userCreatedAt.getTime())
    .slice(0, 8)
    .map((account) => ({
      id: account.userId,
      name: account.name,
      email: account.email,
      businessName: account.businessName,
      createdAt: account.userCreatedAt,
      verified: account.emailVerified,
      paid: hasPortfolioAccess(account, now),
      status: account.subscriptionStatus ?? "none",
      properties: account.landlordId ? propertiesByLandlord.get(account.landlordId) ?? 0 : 0,
      units: account.landlordId ? unitsByLandlord.get(account.landlordId) ?? 0 : 0,
    }));

  const signupGrowth = previousMonthSignups.length > 0
    ? ((currentMonthSignups.length - previousMonthSignups.length) / previousMonthSignups.length) * 100
    : currentMonthSignups.length > 0 ? 100 : 0;
  const churnRate = percent(churnedLandlords.size, payingCustomers.length + churnedLandlords.size);

  return {
    generatedAt: now,
    revenue: {
      mrr,
      arr: mrr * 12,
      realized: realizedRevenue,
      realizedThisMonth: realizedRevenueThisMonth,
      payingCustomers: payingCustomers.length,
      arpu: payingCustomers.length ? mrr / payingCustomers.length : 0,
    },
    growth: {
      totalUsers: customers.length,
      newLast30Days: newLast30Days.length,
      newThisMonth: currentMonthSignups.length,
      previousMonthSignups: previousMonthSignups.length,
      signupGrowth,
      churnedLast30Days: churnedLandlords.size,
      netAddsLast30Days: newLast30Days.length - churnedLandlords.size,
    },
    health: {
      paying: payingCustomers.length,
      free: freeCustomers.length,
      conversionRate: percent(payingCustomers.length, customers.length),
      churnRate,
      activeLast30Days: activeUserIds.size,
      activeRate: percent(activeUserIds.size, customers.length),
      verifiedRate: percent(
        customers.filter((account) => account.emailVerified).length,
        customers.length,
      ),
    },
    adoption: {
      activatedAccounts,
      activationRate: percent(activatedAccounts, customers.length),
      totalProperties,
      totalUnits,
      totalTenants,
      activeTenants,
      averageUnitsPerActivatedAccount: activatedAccounts ? totalUnits / activatedAccounts : 0,
      payingWithProperties: payingCustomers.filter(
        (account) =>
          account.landlordId
          && payingLandlordIds.has(account.landlordId)
          && (propertiesByLandlord.get(account.landlordId) ?? 0) > 0,
      ).length,
    },
    monthly: months.map((month) => ({
      key: month.key,
      label: month.label,
      signups: month.signups,
      revenue: month.revenue,
      churned: month.churned.size,
    })),
    recentAccounts,
  };
}
