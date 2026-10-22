import { describe, expect, it } from "vitest";
import { addMonths, buildSchedule, couponDates, payPattern } from "./schedule";

const d = (s: string) => new Date(`${s}T12:00:00Z`);

describe("addMonths", () => {
  it("keeps the day and clamps month ends", () => {
    expect(addMonths(d("2027-09-30"), -6).toISOString().slice(0, 10)).toBe("2027-03-30");
    expect(addMonths(d("2026-08-31"), 6).toISOString().slice(0, 10)).toBe("2027-02-28");
  });
});

describe("couponDates", () => {
  it("lists remaining semi-annual dates up to maturity", () => {
    const dates = couponDates(d("2029-03-01"), 2, d("2026-10-22")).map((x) => x.toISOString().slice(0, 10));
    expect(dates).toEqual(["2027-03-01", "2027-09-01", "2028-03-01", "2028-09-01", "2029-03-01"]);
  });
});

describe("buildSchedule", () => {
  it("prices a T-bill at a discount and pays face value at maturity", () => {
    const s = buildSchedule({ amount: 100_000, yieldPct: 25.67, couponsPerYear: 0, maturity: d("2027-10-12"), settle: d("2026-10-13") });
    expect(s.payments).toHaveLength(1);
    expect(Math.round(s.totalReceived)).toBe(125_600);
    expect(s.pricePer100).toBeCloseTo(79.62, 2);
  });

  it("pays coupons and returns principal at the end", () => {
    const s = buildSchedule({ amount: 200_000, yieldPct: 7.58, couponsPerYear: 2, couponRatePct: 7.6003, maturity: d("2029-03-01"), settle: d("2026-10-22") });
    expect(s.payments).toHaveLength(5);
    expect(s.payments.at(-1)!.principal).toBeCloseTo(s.faceValue, 6);
    // Coupon at 7.6003% a year, paid twice a year on the face value.
    expect(s.payments[0].coupon).toBeCloseTo((s.faceValue * 0.076003) / 2, 6);
    // Price near par when yield ≈ coupon (plus a little accrued interest).
    expect(s.pricePer100).toBeGreaterThan(100);
    expect(s.pricePer100).toBeLessThan(104);
    expect(s.totalReturn).toBeGreaterThan(0);
  });

  it("buys more face value when the price is below par", () => {
    const s = buildSchedule({ amount: 100_000, yieldPct: 8.77, couponsPerYear: 2, couponRatePct: 6.875, maturity: d("2040-04-30"), settle: d("2026-10-22") });
    expect(s.pricePer100).toBeLessThan(90);
    expect(s.faceValue).toBeGreaterThan(110_000);
  });
});

describe("payPattern", () => {
  it("says T-bills pay once and bonds pay every few months", () => {
    expect(payPattern(0, d("2027-10-13"), d("2026-10-22"))).toEqual({ once: true });
    expect(payPattern(2, d("2029-03-01"), d("2026-10-22"))).toEqual({ once: false, count: 5, everyMonths: 6 });
    expect(payPattern(1, d("2031-04-11"), d("2026-10-22"))).toEqual({ once: false, count: 5, everyMonths: 12 });
  });
});
