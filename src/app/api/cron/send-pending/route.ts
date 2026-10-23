import { CRON_LAST_KEY, cronAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { emailDailyCap } from "@/lib/limits";
import { sendPendingEmails } from "@/lib/waitlist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Runs daily just after the email limit resets (see vercel.json) and sends the
 * emails queued while the previous day's limit was reached.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req.headers.get("authorization"))) return new Response("Unauthorized", { status: 401 });
  const result = await sendPendingEmails(emailDailyCap());
  const value = JSON.stringify({ at: new Date().toISOString(), ...result });
  await prisma.appMeta.upsert({ where: { key: CRON_LAST_KEY }, create: { key: CRON_LAST_KEY, value }, update: { value } });
  console.log("send-pending cron", value);
  return Response.json(result);
}
