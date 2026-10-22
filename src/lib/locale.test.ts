import { describe, expect, it } from "vitest";
import { detectLocale } from "./locale";
import { afterTax, formatYield, groupByCurrency, maturityValue, type Quote } from "./yields";

describe("detectLocale", () => {
  it("prefers a saved choice", () => {
    expect(detectLocale("ar-EG,ar;q=0.9", "en")).toBe("en");
  });
  it("follows the browser language", () => {
    expect(detectLocale("en-US,en;q=0.9")).toBe("en");
    expect(detectLocale("ar-EG,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(detectLocale("fr-FR,fr;q=0.9,en;q=0.5")).toBe("en");
  });
  it("falls back to Arabic", () => {
    expect(detectLocale(null)).toBe("ar");
    expect(detectLocale("fr-FR,de;q=0.8")).toBe("ar");
  });
});

describe("yields", () => {
  const q = (p: Partial<Quote>): Quote => ({
    id: Math.random().toString(),
    currency: "EGP",
    instrument: "TBILL",
    labelEn: "",
    labelAr: "",
    tenorMonths: 3,
    yieldPct: 20,
    couponsPerYear: 0,
    sortOrder: 0,
    asOf: new Date(),
    ...p,
  });

  it("groups by currency in display order and sorts within each", () => {
    const groups = groupByCurrency([
      q({ currency: "USD", sortOrder: 2, labelEn: "b" }),
      q({ currency: "EGP", sortOrder: 5, labelEn: "late" }),
      q({ currency: "USD", sortOrder: 1, labelEn: "a" }),
      q({ currency: "EGP", sortOrder: 1, labelEn: "early" }),
    ]);
    expect(groups.map((g) => g.currency)).toEqual(["EGP", "USD"]);
    expect(groups[0].quotes.map((x) => x.labelEn)).toEqual(["early", "late"]);
    expect(groups[1].quotes.map((x) => x.labelEn)).toEqual(["a", "b"]);
  });

  it("formats yields with two decimals", () => {
    expect(formatYield(23.8)).toBe("23.80");
  });
});

describe("after tax and maturity value", () => {
  it("applies withholding tax only when set", () => {
    expect(afterTax({ yieldPct: 25.67, taxRatePct: 20 })).toBe(20.54);
    expect(afterTax({ yieldPct: 17.25, taxRatePct: 0 })).toBe(17.25);
    expect(afterTax({ yieldPct: 20, taxRatePct: null })).toBeNull();
  });
  it("computes what a T-bill pays back", () => {
    expect(Math.round(maturityValue(100_000, 25.67, 364))).toBe(125_600);
  });
});
