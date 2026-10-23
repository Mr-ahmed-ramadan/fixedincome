import { prisma } from "./db";

/**
 * Fixed-window counters kept in Postgres (works across serverless instances).
 * `tryConsume` adds one to `key` if the window still has room and says whether
 * it did; a window that has ended starts over at 1.
 */
export async function tryConsume(key: string, windowMs: number, limit: number, now = new Date()): Promise<boolean> {
  const resetAt = new Date(now.getTime() + windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateCounter" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateCounter"."resetAt" <= ${now} THEN 1 ELSE "RateCounter"."count" + 1 END,
      "resetAt" = CASE WHEN "RateCounter"."resetAt" <= ${now} THEN EXCLUDED."resetAt" ELSE "RateCounter"."resetAt" END
    WHERE "RateCounter"."resetAt" <= ${now} OR "RateCounter"."count" < ${limit}
    RETURNING "count"`;
  return rows.length > 0;
}

/** Current count in a window (0 if it has ended or never started). */
export async function peek(key: string, now = new Date()): Promise<number> {
  const row = await prisma.rateCounter.findUnique({ where: { key } });
  return row && row.resetAt > now ? row.count : 0;
}

const MINUTE = 60_000;
const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);
const untilMidnightUtc = (d = new Date()) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - d.getTime();

/** Emails we let ourselves send per UTC day; keep under the email plan's limit (Resend free: 100/day). */
export function emailDailyCap(): number {
  const n = Number(process.env.EMAIL_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 90;
}

export const keys = {
  emailToday: () => `email:${utcDay()}`,
  emailMonth: () => `email-month:${utcDay().slice(0, 7)}`,
  blockedToday: () => `blocked:${utcDay()}`,
  ip: (form: "join" | "partner", ip: string) => `${form}:ip:${ip}`,
};

/** Take one email from today's budget. False means today's cap is reached: queue the email instead. */
export async function takeEmailBudget(): Promise<boolean> {
  const ok = await tryConsume(keys.emailToday(), untilMidnightUtc(), emailDailyCap());
  // Monthly total, for the email-plan milestones in /admin.
  if (ok) await tryConsume(keys.emailMonth(), 32 * 24 * 60 * MINUTE, Number.MAX_SAFE_INTEGER);
  return ok;
}

/** Per-network limit for public forms: join 5 / 10 min, partner 3 / 10 min. */
export async function allowFormSubmit(form: "join" | "partner", ip: string): Promise<boolean> {
  const ok = await tryConsume(keys.ip(form, ip), 10 * MINUTE, form === "join" ? 5 : 3);
  if (!ok) await tryConsume(keys.blockedToday(), untilMidnightUtc(), Number.MAX_SAFE_INTEGER);
  return ok;
}

/** Don't send the same kind of email to the same person again within this many minutes. */
export const RESEND_AFTER = { VERIFY: 10 * MINUTE, WELCOME: 60 * MINUTE } as const;

export function sentRecently(sentAt: Date | null | undefined, ms: number, now = new Date()): boolean {
  return Boolean(sentAt && now.getTime() - sentAt.getTime() < ms);
}
