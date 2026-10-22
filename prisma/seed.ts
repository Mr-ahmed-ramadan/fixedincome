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

  await prisma.appMeta.upsert({ where: { key: VERSION_KEY }, create: { key: VERSION_KEY, value: String(version) }, update: { value: String(version) } });
  console.log(version === start ? `Yields up to date (v${version}).` : `Yields seeded from v${start} to v${version}.`);
}

main().finally(() => prisma.$disconnect());
