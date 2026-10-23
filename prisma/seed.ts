// Loads the starting yields. Runs on every Vercel deploy (see `vercel-build`),
// but each version below is applied only once, so rates edited in /admin are
// never overwritten.
//
// Sources (October 2026):
// - EGP T-bills: CBE auction of 13 Oct 2026, weighted average accepted yields.
// - EGP 3-year T-bond: CBE auction of 19 Oct 2026, 24.128% weighted average
//   yield, semi-annual coupon.
// - USD/EUR Eurobonds (v4): ask-side yields at the last close before 22 Oct
//   2026, from the owner's broker screen ("best yield per tenor"), which also
//   gives each bond's coupon, maturity, ISIN and minimum order (v5).
// - T-bill maturities: auction date plus 91/182/364 days.
// - USD T-bill: last published one-year result (Dec 2025); starts hidden.
//   v6 shows it with the CBE's 1 Jun 2026 one-year auction (4.20% accepted).
// - EGP 9-month (273-day) T-bill (v6): auction of 18 Oct 2026, 25.383%
//   weighted average as reported by market press (issued 20 Oct 2026).
// - Bank equivalents (EnterpriseAM savings guide, 16 Aug 2026): CIB 12-month
//   deposit up to 17%; NBE Platinum / Banque Misr Al Qimma 3-year CD 17.75%
//   paid monthly. Shown on the site as anonymous "Bank A" / "Bank B". Bank
//   interest is tax-free for Egyptian residents; T-bill and bond returns have
//   20% withheld.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VERSION_KEY = "yieldSeedVersion";

type Row = {
  currency: string;
  instrument: string;
  labelEn: string;
  labelAr: string;
  tenorMonths: number;
  yieldPct: number;
  couponsPerYear: number;
  sortOrder: number;
  asOf: string;
  taxRatePct?: number | null;
  active?: boolean;
  bank?: { pct: number; en: string; ar: string; asOf: string };
};

const v1: Row[] = [
  { currency: "EGP", instrument: "TBILL", labelEn: "3-month T-bill", labelAr: "أذون خزانة 3 شهور", tenorMonths: 3, yieldPct: 23.83, couponsPerYear: 0, sortOrder: 10, asOf: "2026-10-13", taxRatePct: 20 },
  { currency: "EGP", instrument: "TBILL", labelEn: "6-month T-bill", labelAr: "أذون خزانة 6 شهور", tenorMonths: 6, yieldPct: 24.96, couponsPerYear: 0, sortOrder: 20, asOf: "2026-10-13", taxRatePct: 20 },
  { currency: "EGP", instrument: "TBILL", labelEn: "12-month T-bill", labelAr: "أذون خزانة 12 شهر", tenorMonths: 12, yieldPct: 25.67, couponsPerYear: 0, sortOrder: 30, asOf: "2026-10-13", taxRatePct: 20 },
  { currency: "USD", instrument: "TBILL", labelEn: "12-month USD T-bill", labelAr: "أذون خزانة دولارية 12 شهر", tenorMonths: 12, yieldPct: 3.5, couponsPerYear: 0, sortOrder: 10, asOf: "2025-12-29", taxRatePct: 20, active: false },
  { currency: "USD", instrument: "EUROBOND", labelEn: "Eurobond 2030", labelAr: "يوروبوند 2030", tenorMonths: 40, yieldPct: 7.38, couponsPerYear: 2, sortOrder: 20, asOf: "2026-10-14" },
  { currency: "USD", instrument: "EUROBOND", labelEn: "Eurobond 2040", labelAr: "يوروبوند 2040", tenorMonths: 162, yieldPct: 8.61, couponsPerYear: 2, sortOrder: 30, asOf: "2026-10-07" },
];

// Banks are shown anonymously.
const BANK_A = { en: "Bank A · 12-month deposit", ar: "البنك (أ) · وديعة 12 شهر" };
const BANK_B = { en: "Bank B · 3-year CD", ar: "البنك (ب) · شهادة 3 سنوات" };

const v3: Row[] = [
  {
    currency: "EGP", instrument: "BOND", labelEn: "3-year T-bond", labelAr: "سندات خزانة 3 سنوات", tenorMonths: 36, yieldPct: 24.13, couponsPerYear: 2, sortOrder: 40, asOf: "2026-10-19", taxRatePct: 20,
    bank: { pct: 17.75, en: BANK_B.en, ar: BANK_B.ar, asOf: "2026-08-16" },
  },
];
const bank12m = { pct: 17, en: BANK_A.en, ar: BANK_A.ar, asOf: "2026-08-16" };

const eb = (currency: string, year: number, coupon: number, couponsPerYear: number, tenorMonths: number, yieldPct: number, sortOrder: number): Row => ({
  currency, instrument: "EUROBOND", labelEn: `Eurobond ${year} · ${coupon}%`, labelAr: `يوروبوند ${year} · ${coupon}%`,
  tenorMonths, yieldPct, couponsPerYear, sortOrder, asOf: "2026-10-21",
});
const v4Eurobonds: Row[] = [
  eb("USD", 2027, 5.8, 2, 11, 6.61, 20),
  eb("USD", 2029, 7.6003, 2, 29, 7.58, 30),
  eb("USD", 2031, 5.875, 2, 52, 8.03, 40),
  eb("USD", 2034, 7.625, 2, 91, 8.68, 50),
  eb("USD", 2040, 6.875, 2, 162, 8.77, 60),
  eb("USD", 2049, 8.7002, 2, 269, 10.06, 70),
  eb("EUR", 2031, 6.375, 1, 54, 7.09, 10),
];

const day = (d: string) => new Date(`${d}T12:00:00Z`);
const bankData = (b: NonNullable<Row["bank"]>) => ({ bankRatePct: b.pct, bankLabelEn: b.en, bankLabelAr: b.ar, bankAsOf: day(b.asOf) });

// v5: details for each security's own page, matched by English label.
const v5Details: Record<string, { coupon?: number; maturity: string; isin?: string; min?: number }> = {
  "3-month T-bill": { maturity: "2027-01-12" },
  "6-month T-bill": { maturity: "2027-04-13" },
  "12-month T-bill": { maturity: "2027-10-12" },
  "3-year T-bond": { coupon: 23.981, maturity: "2029-10-06" },
  "Eurobond 2027 · 5.8%": { coupon: 5.8, maturity: "2027-09-30", isin: "XS2391394348", min: 200_000 },
  "Eurobond 2029 · 7.6003%": { coupon: 7.6003, maturity: "2029-03-01", isin: "US03846JW719", min: 200_000 },
  "Eurobond 2031 · 5.875%": { coupon: 5.875, maturity: "2031-02-16", isin: "XS2297226545", min: 200_000 },
  "Eurobond 2034 · 7.625%": { coupon: 7.625, maturity: "2034-05-20", isin: "US03846JAJ97", min: 200_000 },
  "Eurobond 2040 · 6.875%": { coupon: 6.875, maturity: "2040-04-30", isin: "XS0505478684", min: 100_000 },
  "Eurobond 2049 · 8.7002%": { coupon: 8.7002, maturity: "2049-03-01", isin: "XS1953057491", min: 200_000 },
  "Eurobond 2031 · 6.375%": { coupon: 6.375, maturity: "2031-04-11", isin: "XS1980255936", min: 100_000 },
};

const v6NineMonth: Row = { currency: "EGP", instrument: "TBILL", labelEn: "9-month T-bill", labelAr: "أذون خزانة 9 شهور", tenorMonths: 9, yieldPct: 25.38, couponsPerYear: 0, sortOrder: 25, asOf: "2026-10-18", taxRatePct: 20 };

async function insert(rows: Row[]) {
  for (const { bank, ...r } of rows) {
    await prisma.yieldQuote.create({
      data: { ...r, active: r.active ?? true, taxRatePct: r.taxRatePct ?? null, asOf: day(r.asOf), ...(bank ? bankData(bank) : {}) },
    });
  }
}

async function main() {
  const meta = await prisma.appMeta.findUnique({ where: { key: VERSION_KEY } });
  // Databases seeded before versioning existed already have the v1 rows.
  let version = meta ? Number(meta.value) : (await prisma.yieldQuote.count()) > 0 ? 1 : 0;
  const start = version;

  if (version < 1) {
    await insert(v1);
    version = 1;
  }
  if (version < 2) {
    // v2 added withholding tax rates (fresh databases already get them from v1).
    await prisma.yieldQuote.updateMany({ where: { instrument: { in: ["TBILL", "BOND"] }, taxRatePct: null }, data: { taxRatePct: 20 } });
    version = 2;
  }
  if (version < 3) {
    // v3: bank deposits/CDs sit next to each maturity instead of as separate rows.
    await prisma.yieldQuote.deleteMany({ where: { instrument: { in: ["CD", "MMF"] } } });
    await prisma.yieldQuote.updateMany({ where: { currency: "EGP", instrument: "TBILL", tenorMonths: 12, bankRatePct: null }, data: bankData(bank12m) });
    await insert(v3);
    version = 3;
  }
  if (version < 4) {
    // v4: the full Eurobond list (USD and EUR), and banks shown as Bank A / Bank B.
    await prisma.yieldQuote.deleteMany({ where: { instrument: "EUROBOND" } });
    await insert(v4Eurobonds);
    await prisma.yieldQuote.updateMany({ where: { bankLabelEn: "12-month bank deposit (CIB)" }, data: { bankLabelEn: BANK_A.en, bankLabelAr: BANK_A.ar } });
    await prisma.yieldQuote.updateMany({ where: { bankLabelEn: "3-year bank CD (NBE, Banque Misr)" }, data: { bankLabelEn: BANK_B.en, bankLabelAr: BANK_B.ar } });
    version = 4;
  }
  if (version < 5) {
    for (const [labelEn, d] of Object.entries(v5Details)) {
      await prisma.yieldQuote.updateMany({
        where: { labelEn, maturityDate: null },
        data: { couponRatePct: d.coupon ?? null, maturityDate: day(d.maturity), isin: d.isin ?? null, minInvestment: d.min ?? null },
      });
    }
    version = 5;
  }
  if (version < 6) {
    // v6: very short tenors, the 9-month EGP T-bill and the one-year USD T-bill.
    await insert([v6NineMonth]);
    await prisma.yieldQuote.updateMany({ where: { labelEn: "9-month T-bill" }, data: { maturityDate: day("2027-07-20") } });
    await prisma.yieldQuote.updateMany({
      where: { labelEn: "12-month USD T-bill" },
      data: { active: true, yieldPct: 4.2, asOf: day("2026-06-01"), maturityDate: day("2027-06-01") },
    });
    version = 6;
  }

  await prisma.appMeta.upsert({ where: { key: VERSION_KEY }, create: { key: VERSION_KEY, value: String(version) }, update: { value: String(version) } });
  console.log(version === start ? `Yields up to date (v${version}).` : `Yields seeded from v${start} to v${version}.`);
}

// --- Marketing launch plan (/admin → Marketing). Its own version key; seeded once, then edited in admin.
const MKT_KEY = "marketingSeedVersion";

const channels = [
  { key: "facebook", name: "Facebook", audience: "Biggest reach in Egypt, all ages; longer posts and groups" },
  { key: "instagram", name: "Instagram", audience: "Carousels and Reels; younger, urban" },
  { key: "tiktok", name: "TikTok", audience: "Short explainers; cheapest attention" },
  { key: "whatsapp", name: "WhatsApp Channel", audience: "Weekly rates update; Egyptians at home and abroad" },
  { key: "youtube", name: "YouTube", audience: "Shorts (reuse TikToks) and longer explainers that rank in search" },
  { key: "linkedin", name: "LinkedIn", audience: "Founding partners (brokers, banks, asset managers) and credibility" },
  { key: "x", name: "X", audience: "Finance and news crowd; rates only" },
];

// Week 0 starts Monday 26 Oct 2026; each week's tasks are due by its Friday.
const due = (week: number, dayOffset = 4) => day(new Date(Date.UTC(2026, 9, 26 + week * 7 + dayOffset)).toISOString().slice(0, 10));
type T = { week: number; title: string; channel?: string; kind: string; owner: "YOU" | "CLAUDE"; notes?: string };
const plan: T[] = [
  // Week 0: setup
  { week: 0, kind: "SETUP", owner: "YOU", title: "Reserve @agyal (or the closest handle) on every channel", notes: "Same handle everywhere; add it to the Channels table above." },
  { week: 0, kind: "SETUP", owner: "CLAUDE", title: "Write bios for every channel (Arabic + English, colloquial)" },
  { week: 0, kind: "SETUP", owner: "YOU", title: "Add profile picture, cover and bio with the tagged agyal.net link", notes: "Profile picture and covers: Brand tab. Links: copy from the Channels table." },
  { week: 0, kind: "SETUP", owner: "YOU", title: "Create the WhatsApp Channel", channel: "whatsapp" },
  { week: 0, kind: "SETUP", owner: "YOU", title: "Create the YouTube channel", channel: "youtube" },
  { week: 0, kind: "SETUP", owner: "YOU", title: "Optional: connect TikTok (Higgsfield) and Facebook/Instagram/LinkedIn (Make) so posts can be scheduled" },
  // Week 1: first content
  { week: 1, kind: "CONTENT", owner: "CLAUDE", title: "Brand templates: weekly rates post, carousel, story" },
  { week: 1, kind: "CONTENT", owner: "CLAUDE", title: "Egyptian-Arabic voice samples (check cost first)", notes: "Fallback: no voice, bold Arabic subtitles + music." },
  { week: 1, kind: "CONTENT", owner: "CLAUDE", title: "Explainer 1 (30s): What is a T-bill? «يعني إيه أذون خزانة؟»", channel: "tiktok" },
  { week: 1, kind: "CONTENT", owner: "YOU", title: "Publish the launch post «سندات مصر، في جيبك» on all channels" },
  { week: 1, kind: "CONTENT", owner: "YOU", title: "Post this week's T-bill rates (after the CBE auction)", channel: "whatsapp" },
  { week: 1, kind: "OUTREACH", owner: "CLAUDE", title: "Partner one-pager (PDF) and LinkedIn outreach message", channel: "linkedin" },
  // Week 2
  { week: 2, kind: "CONTENT", owner: "YOU", title: "Post this week's T-bill rates", channel: "whatsapp" },
  { week: 2, kind: "CONTENT", owner: "CLAUDE", title: "Explainer 2: How do coupons work? (bonds pay twice a year)", channel: "tiktok" },
  { week: 2, kind: "CONTENT", owner: "CLAUDE", title: "Carousel: T-bill vs bank certificate, after tax", channel: "instagram" },
  { week: 2, kind: "OUTREACH", owner: "YOU", title: "Send the partner message to 10 brokers / banks", channel: "linkedin" },
  { week: 2, kind: "REVIEW", owner: "YOU", title: "Weekly review: sign-ups by channel (funnel above); double down on the best one" },
  // Week 3
  { week: 3, kind: "CONTENT", owner: "YOU", title: "Post this week's T-bill rates", channel: "whatsapp" },
  { week: 3, kind: "CONTENT", owner: "CLAUDE", title: "Explainer 3: Why bonds instead of a money market fund?", channel: "tiktok" },
  { week: 3, kind: "CONTENT", owner: "CLAUDE", title: "Explainer for Egyptians abroad: dollar Eurobonds", channel: "facebook" },
  { week: 3, kind: "CONTENT", owner: "CLAUDE", title: "Founding-partner video (60–90s)", channel: "linkedin" },
  { week: 3, kind: "OUTREACH", owner: "YOU", title: "Send the partner message to 10 more; book calls", channel: "linkedin" },
  { week: 3, kind: "REVIEW", owner: "YOU", title: "Weekly review: sign-ups by channel" },
  // Week 4
  { week: 4, kind: "CONTENT", owner: "YOU", title: "Post this week's T-bill rates", channel: "whatsapp" },
  { week: 4, kind: "CONTENT", owner: "CLAUDE", title: "Referral push: «ادعُ صحابك» post + story using invite links" },
  { week: 4, kind: "CONTENT", owner: "CLAUDE", title: "Explainer 4: What happens if I sell before maturity?", channel: "tiktok" },
  { week: 4, kind: "REVIEW", owner: "YOU", title: "Month review with Claude: what worked, next month's plan" },
];

async function seedMarketing() {
  const meta = await prisma.appMeta.findUnique({ where: { key: MKT_KEY } });
  if (meta && Number(meta.value) >= 1) return;
  for (const [i, c] of channels.entries()) {
    await prisma.marketingChannel.upsert({ where: { key: c.key }, create: { ...c, sortOrder: i }, update: {} });
  }
  if ((await prisma.marketingTask.count()) === 0) {
    await prisma.marketingTask.createMany({
      data: plan.map((t, i) => ({ ...t, channel: t.channel ?? "all", dueDate: due(t.week), sortOrder: i })),
    });
  }
  await prisma.appMeta.upsert({ where: { key: MKT_KEY }, create: { key: MKT_KEY, value: "1" }, update: { value: "1" } });
  console.log("Marketing plan seeded.");
}

main()
  .then(seedMarketing)
  .finally(() => prisma.$disconnect());
