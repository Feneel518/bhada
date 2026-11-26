import { sendDailySummaries } from "@/lib/daily-summary";

// Runs at 08:10 IST so the summary is waiting when landlords start their day.
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
  const result = await sendDailySummaries(now);
  return Response.json({ ...result, runAt: now.toISOString() });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
