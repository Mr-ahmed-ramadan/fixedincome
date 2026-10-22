// Seeds the yields board with recent public figures. Run once after the first
// migration (`npm run seed`); afterwards edit rates from /admin.
// Sources (October 2026): CBE EGP T-bill auction of 13 Oct 2026 (weighted
// average accepted yields); USD Eurobond yields from bondterminal.com and
// MSA Securities. The USD T-bill is the last published one-year result
// (Dec 2025) and starts hidden until you update it.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const quotes = [
  { currency: "EGP", instrument: "TBILL", labelEn: "3-month T-bill", labelAr: "أذون خزانة 3 شهور", tenorMonths: 3, yieldPct: 23.83, couponsPerYear: 0, sortOrder: 10, asOf: "2026-10-13" },
  { currency: "EGP", instrument: "TBILL", labelEn: "6-month T-bill", labelAr: "أذون خزانة 6 شهور", tenorMonths: 6, yieldPct: 24.96, couponsPerYear: 0, sortOrder: 20, asOf: "2026-10-13" },
  { currency: "EGP", instrument: "TBILL", labelEn: "12-month T-bill", labelAr: "أذون خزانة 12 شهر", tenorMonths: 12, yieldPct: 25.67, couponsPerYear: 0, sortOrder: 30, asOf: "2026-10-13" },
  { currency: "USD", instrument: "TBILL", labelEn: "12-month USD T-bill", labelAr: "أذون خزانة دولارية 12 شهر", tenorMonths: 12, yieldPct: 3.5, couponsPerYear: 0, sortOrder: 10, asOf: "2025-12-29", active: false },
  { currency: "USD", instrument: "EUROBOND", labelEn: "Eurobond 2030", labelAr: "يوروبوند 2030", tenorMonths: 40, yieldPct: 7.38, couponsPerYear: 2, sortOrder: 20, asOf: "2026-10-14" },
  { currency: "USD", instrument: "EUROBOND", labelEn: "Eurobond 2040", labelAr: "يوروبوند 2040", tenorMonths: 162, yieldPct: 8.61, couponsPerYear: 2, sortOrder: 30, asOf: "2026-10-07" },
];

async function main() {
  if ((await prisma.yieldQuote.count()) > 0) {
    console.log("Yields already exist; leaving them alone.");
    return;
  }
  for (const q of quotes) {
    await prisma.yieldQuote.create({ data: { active: true, ...q, asOf: new Date(`${q.asOf}T12:00:00Z`) } });
  }
  console.log(`Seeded ${quotes.length} yields.`);
}

main().finally(() => prisma.$disconnect());
