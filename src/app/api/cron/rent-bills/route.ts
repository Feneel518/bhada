import { generateMonthlyRentBills } from "@/lib/rent-billing";

async function handleCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scheduledTime = Number(request.headers.get("x-scheduled-time"));
  const now = Number.isFinite(scheduledTime) && scheduledTime > 0
    ? new Date(scheduledTime)
    : new Date();
  const generated = await generateMonthlyRentBills(now);

  return Response.json({
    generated,
    billingRunAt: now.toISOString(),
  });
}

// Vercel Cron invokes production routes with GET. POST remains available for
// the existing Cloudflare worker wrapper and local authenticated testing.
export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
