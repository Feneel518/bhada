import "server-only";

import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { landlord, user } from "@/db/schema";
import { buildCollection, summaryToSend } from "@/lib/collection";
import { sendDailySummaryEmail } from "@/lib/email";
import { getElectricityBills } from "@/lib/electricity-billing";
import { getRentBilling } from "@/lib/rent-billing";
import { appOrigin } from "@/lib/share-links";
import { portalUrl } from "@/lib/tenant-portal";
import { getTenantAnalytics } from "@/lib/tenant-analytics";
import { getTenants } from "@/lib/tenants";
import { formatCurrency } from "@/lib/utils";
import { reminderMessage, whatsappLink } from "@/lib/whatsapp";

// Keeps one cron run inside serverless time limits; anyone skipped is picked
// up the next morning because last_summary_email_at stays unchanged.
const MAX_PER_RUN = 150;

function indiaDay(now: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

function indiaWeekday(now: Date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

function startOfIndiaDay(now: Date) {
  return new Date(`${indiaDay(now)}T00:00:00+05:30`);
}

export async function sendDailySummaries(now = new Date()) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { sent: 0, skipped: "smtp_not_configured" as const };
  }
  const today = indiaDay(now);
  const weekday = indiaWeekday(now);
  const dayStart = startOfIndiaDay(now);
  const candidates = await db
    .select({
      id: landlord.id,
      userId: landlord.userId,
      businessName: landlord.businessName,
      upiId: landlord.upiId,
      email: user.email,
      name: user.name,
    })
    .from(landlord)
    .innerJoin(user, eq(landlord.userId, user.id))
    .where(and(
      eq(landlord.dailySummaryEmail, true),
      eq(user.emailVerified, true),
      or(isNull(landlord.lastSummaryEmailAt), lt(landlord.lastSummaryEmailAt, dayStart)),
    ))
    .limit(MAX_PER_RUN);

  let sent = 0;
  let failed = 0;
  for (const owner of candidates) {
    try {
      const [tenants, billing, electricity, analytics] = await Promise.all([
        getTenants(owner.userId),
        getRentBilling(owner.userId, now),
        getElectricityBills(owner.userId, now),
        getTenantAnalytics(owner.userId),
      ]);
      const rows = buildCollection({ tenants, rentBills: billing.bills, electricityBills: electricity, analytics, today });
      const summary = summaryToSend(rows, today, weekday);
      // Mark the day as handled either way, so quiet landlords are not
      // recomputed again until tomorrow.
      await db.update(landlord).set({ lastSummaryEmailAt: now }).where(eq(landlord.id, owner.id));
      if (!summary) continue;

      const lines = await Promise.all(summary.lines.map(async (row) => {
        const billUrl = portalUrl(row.tenant.portalToken);
        return {
          tenant: row.tenant.name,
          place: `${row.tenant.propertyName} · Unit ${row.tenant.unitNumber}`,
          amount: formatCurrency(row.outstanding),
          status: row.status === "overdue" ? (row.daysOverdue ? `${row.daysOverdue} days late` : "overdue") : "due today",
          remindUrl: whatsappLink(row.tenant.phone, reminderMessage({
            tenantName: row.tenant.name,
            landlordName: owner.businessName,
            amount: row.outstanding,
            dueDate: row.dueDate ?? undefined,
            overdue: row.status === "overdue",
            billUrl,
            upiId: owner.upiId ?? undefined,
          })),
        };
      }));
      const total = summary.lines.reduce((sum, row) => sum + row.outstanding, 0);
      const count = summary.lines.length;
      await sendDailySummaryEmail({
        to: owner.email,
        name: owner.name,
        subject: `${count} rent${count === 1 ? "" : "s"} to collect · ${formatCurrency(total)}`,
        intro: summary.dueToday.length && !summary.overdue.length
          ? `rent is due today from ${summary.dueToday.length} tenant${summary.dueToday.length === 1 ? "" : "s"}.`
          : `${formatCurrency(total)} is waiting to be collected. One tap sends each tenant a WhatsApp reminder with a UPI link.`,
        lines,
        dashboardUrl: `${appOrigin()}/dashboard`,
        settingsUrl: `${appOrigin()}/dashboard?section=Profile`,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("Daily summary failed", owner.id, error);
    }
  }
  return { sent, failed, checked: candidates.length };
}
