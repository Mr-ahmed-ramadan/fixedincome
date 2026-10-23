import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

const BATCH = 2000;

function line(cells: (string | number | null | undefined | Date)[]): string {
  const cell = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
    // Quote everything; neutralise spreadsheet formulas.
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  return cells.map(cell).join(",") + "\r\n";
}

/**
 * Stream rows as CSV, fetching them in batches by id cursor, so the download
 * works at any list size without holding everything in memory.
 */
function csvStream<T extends { id: string }>(header: string[], fetch: (cursor?: string) => Promise<T[]>, toRow: (r: T) => Parameters<typeof line>[0]) {
  const enc = new TextEncoder();
  let cursor: string | undefined;
  let started = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!started) {
        started = true;
        controller.enqueue(enc.encode("﻿" + line(header))); // BOM so Excel reads Arabic correctly
      }
      const rows = await fetch(cursor);
      if (rows.length === 0) return controller.close();
      controller.enqueue(enc.encode(rows.map((r) => line(toRow(r))).join("")));
      cursor = rows[rows.length - 1].id;
      if (rows.length < BATCH) controller.close();
    },
  });
}

const page = (cursor?: string) => ({ take: BATCH, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), orderBy: { id: "asc" as const } });

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const type = new URL(req.url).searchParams.get("type");

  const body =
    type === "partners"
      ? csvStream(
          ["created", "institution", "type", "name", "role", "email", "phone", "message", "language"],
          (cursor) => prisma.partnerRequest.findMany(page(cursor)),
          (r) => [r.createdAt, r.institution, r.type, r.name, r.role, r.email, r.phone, r.message, r.locale],
        )
      : csvStream(
          ["created", "name", "email", "phone", "language", "signup", "confirmed", "invite_code", "invited_by", "friends_invited", "utm_source", "utm_medium", "utm_campaign", "utm_content", "note", "unsubscribed", "email_pending"],
          (cursor) =>
            prisma.waitlistUser.findMany({
              ...page(cursor),
              include: { referredBy: { select: { email: true } }, _count: { select: { referrals: true } } },
            }),
          (r) => [r.createdAt, r.name, r.email, r.phone, r.locale, r.provider, r.emailVerifiedAt, r.referralCode, r.referredBy?.email, r._count.referrals, r.utmSource, r.utmMedium, r.utmCampaign, r.utmContent, r.note, r.unsubscribedAt, r.pendingEmail],
        );

  const name = `agyal-${type === "partners" ? "partners" : "waitlist"}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
