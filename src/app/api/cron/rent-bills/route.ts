import { generateMonthlyRentBills } from "@/lib/rent-billing";

export async function POST(request: Request) {
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
