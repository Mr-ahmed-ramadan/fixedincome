import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

function csv(rows: (string | number | null | undefined | Date)[][]): string {
  const cell = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
    // Quote everything; neutralise spreadsheet formulas.
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const type = new URL(req.url).searchParams.get("type");

  let body: string;
  if (type === "partners") {
    const rows = await prisma.partnerRequest.findMany({ orderBy: { createdAt: "desc" } });
    body = csv([
      ["created", "institution", "type", "name", "role", "email", "phone", "message", "language"],
      ...rows.map((r) => [r.createdAt, r.institution, r.type, r.name, r.role, r.email, r.phone, r.message, r.locale]),
    ]);
  } else {
    const rows = await prisma.waitlistUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { referredBy: { select: { email: true } }, _count: { select: { referrals: true } } },
    });
    body = csv([
      ["created", "name", "email", "phone", "language", "signup", "confirmed", "invite_code", "invited_by", "friends_invited", "utm_source", "utm_medium", "utm_campaign", "utm_content"],
      ...rows.map((r) => [r.createdAt, r.name, r.email, r.phone, r.locale, r.provider, r.emailVerifiedAt, r.referralCode, r.referredBy?.email, r._count.referrals, r.utmSource, r.utmMedium, r.utmCampaign, r.utmContent]),
    ]);
  }

  const name = `agyal-${type === "partners" ? "partners" : "waitlist"}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
