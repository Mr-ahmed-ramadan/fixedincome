// Loads the starting yields. Runs on every Vercel deploy (see `vercel-build`),
// but each version below is applied only once, so rates edited in /admin are
// never overwritten.
//
// Sources (October 2026):
// - EGP T-bills: CBE auction of 13 Oct 2026, weighted average accepted yields.
// - USD Eurobonds: bondterminal.com (2030) and MSA Securities (2040).
// - USD T-bill: last published one-year result (Dec 2025); starts hidden.
// - Bank CD: NBE Platinum / Banque Misr Al Qimma 3-year CD, 17.25% paid
//   monthly from 22 Apr 2026 (Ahram Online). Interest on bank deposits is
//   tax-free for Egyptian residents; T-bill/bond returns have 20% withheld.
// - Money market funds: recent annualised returns of about 20% (Crédit
//   Agricole Egypt MMF 3, 19.98% YTD annualised on 19 Oct 2026; category
//   median ~20%). Varies daily.
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
  compare?: boolean;
  active?: boolean;
};

const v1: Row[] = [
  { currency: "EGP", instrument: "TBILL", labelEn: "3-month T-bill", labelAr: "أذون خزانة 3 شهور", tenorMonths: 3, yieldPct: 23.83, couponsPerYear: 0, sortOrder: 10, asOf: "2026-10-13", taxRatePct: 20 },
  { currency: "EGP", instrument: "TBILL", labelEn: "6-month T-bill", labelAr: "أذون خزانة 6 شهور", tenorMonths: 6, yieldPct: 24.96, couponsPerYear: 0, sortOrder: 20, asOf: "2026-10-13", taxRatePct: 20 },
  { currency: "EGP", instrument: "TBILL", labelEn: "12-month T-bill", labelAr: "أذون خزانة 12 شهر", tenorMonths: 12, yieldPct: 25.67, couponsPerYear: 0, sortOrder: 30, asOf: "2026-10-13", taxRatePct: 20, compare: true },
  { currency: "USD", instrument: "TBILL", labelEn: "12-month USD T-bill", labelAr: "أذون خزانة دولارية 12 شهر", tenorMonths: 12, yieldPct: 3.5, couponsPerYear: 0, sortOrder: 10, asOf: "2025-12-29", taxRatePct: 20, active: false },
  { currency: "USD", instrument: "EUROBOND", labelEn: "Eurobond 2030", labelAr: "يوروبوند 2030", tenorMonths: 40, yieldPct: 7.38, couponsPerYear: 2, sortOrder: 20, asOf: "2026-10-14" },
  { currency: "USD", instrument: "EUROBOND", labelEn: "Eurobond 2040", labelAr: "يوروبوند 2040", tenorMonths: 162, yieldPct: 8.61, couponsPerYear: 2, sortOrder: 30, asOf: "2026-10-07" },
];

const v2Comparison: Row[] = [
  { currency: "EGP", instrument: "CD", labelEn: "3-year bank CD", labelAr: "شهادة بنكية 3 سنوات", tenorMonths: 36, yieldPct: 17.25, couponsPerYear: 12, sortOrder: 100, asOf: "2026-04-22", taxRatePct: 0, compare: true },
  { currency: "EGP", instrument: "MMF", labelEn: "Money market fund", labelAr: "صندوق أسواق النقد", tenorMonths: 1, yieldPct: 20.0, couponsPerYear: 0, sortOrder: 110, asOf: "2026-10-19", taxRatePct: null, compare: true },
];

async function insert(rows: Row[]) {
  for (const r of rows) {
    await prisma.yieldQuote.create({
      data: { ...r, active: r.active ?? true, compare: r.compare ?? false, taxRatePct: r.taxRatePct ?? null, asOf: new Date(`${r.asOf}T12:00:00Z`) },
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
    if (start >= 1) {
      // Existing databases: add tax rates and the comparison flag to the v1 rows.
      await prisma.yieldQuote.updateMany({ where: { instrument: { in: ["TBILL", "BOND"] }, taxRatePct: null }, data: { taxRatePct: 20 } });
      await prisma.yieldQuote.updateMany({ where: { currency: "EGP", instrument: "TBILL", tenorMonths: 12 }, data: { compare: true } });
    }
    await insert(v2Comparison);
    version = 2;
  }

  await prisma.appMeta.upsert({ where: { key: VERSION_KEY }, create: { key: VERSION_KEY, value: String(version) }, update: { value: String(version) } });
  console.log(version === start ? `Yields up to date (v${version}).` : `Yields seeded from v${start} to v${version}.`);
}

main().finally(() => prisma.$disconnect());
