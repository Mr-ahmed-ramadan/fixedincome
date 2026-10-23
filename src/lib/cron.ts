/** Where the daily send-pending job records its last run (shown in /admin). */
export const CRON_LAST_KEY = "cron:send-pending:last";

/** Only Vercel Cron (which sends `Authorization: Bearer $CRON_SECRET`) may run scheduled jobs. */
export function cronAuthorized(header: string | null, secret = process.env.CRON_SECRET): boolean {
  return Boolean(secret) && header === `Bearer ${secret}`;
}
