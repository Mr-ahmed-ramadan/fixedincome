/**
 * Indicative cash flows for an amount invested in a T-bill or bond, priced
 * from its yield. Simplifications (fine for an illustration, labelled
 * "estimate" on the page): coupons are an equal share of the annual rate,
 * dates step back from maturity in whole months, and the bond is priced by
 * discounting each payment at the yield (so the amount includes accrued
 * interest).
 */

export type Payment = { date: Date; coupon: number; principal: number; total: number };

export type Schedule = {
  payments: Payment[];
  pricePer100: number; // what you pay per 100 of face value
  faceValue: number; // face value your amount buys
  totalReceived: number;
  totalReturn: number; // totalReceived − amount
  years: number; // settlement to maturity
};

const DAY = 86_400_000;

/** Same day of month `n` months later (or earlier), clamped to the month's last day. */
export function addMonths(d: Date, n: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last), 12));
}

/** Coupon dates after `settle`, stepping back from maturity every 12/f months. */
export function couponDates(maturity: Date, couponsPerYear: number, settle: Date): Date[] {
  const step = 12 / couponsPerYear;
  const dates: Date[] = [];
  for (let k = 0; ; k++) {
    const d = addMonths(maturity, -k * step);
    if (d.getTime() <= settle.getTime()) break;
    dates.unshift(d);
    if (k > 1200) break; // safety
  }
  return dates;
}

export function buildSchedule(opts: {
  amount: number;
  yieldPct: number;
  couponsPerYear: number;
  couponRatePct?: number | null;
  maturity: Date;
  settle: Date;
}): Schedule {
  const { amount, couponsPerYear, maturity, settle } = opts;
  const y = opts.yieldPct / 100;
  const years = Math.max(0, (maturity.getTime() - settle.getTime()) / DAY / 365);

  if (couponsPerYear === 0) {
    // Discount instrument: pay less than face value now, get face value at maturity.
    const days = Math.max(0, Math.round((maturity.getTime() - settle.getTime()) / DAY));
    const growth = 1 + y * (days / 365);
    const face = amount * growth;
    return {
      payments: [{ date: maturity, coupon: 0, principal: face, total: face }],
      pricePer100: 100 / growth,
      faceValue: face,
      totalReceived: face,
      totalReturn: face - amount,
      years,
    };
  }

  const f = couponsPerYear;
  const c = (opts.couponRatePct ?? opts.yieldPct) / 100;
  const dates = couponDates(maturity, f, settle);
  const per100 = (100 * c) / f;
  const price = dates.reduce((sum, d, i) => {
    const t = (d.getTime() - settle.getTime()) / DAY / 365;
    const cf = per100 + (i === dates.length - 1 ? 100 : 0);
    return sum + cf / Math.pow(1 + y / f, f * t);
  }, 0);
  const face = (amount / price) * 100;
  const coupon = (face * c) / f;
  const payments = dates.map((date, i) => {
    const principal = i === dates.length - 1 ? face : 0;
    return { date, coupon, principal, total: coupon + principal };
  });
  const totalReceived = payments.reduce((s, p) => s + p.total, 0);
  return { payments, pricePer100: price, faceValue: face, totalReceived, totalReturn: totalReceived - amount, years };
}

/** How a security pays, for the one-line summary: once at maturity, or n payments every k months. */
export function payPattern(couponsPerYear: number, maturity: Date, settle: Date): { once: true } | { once: false; count: number; everyMonths: number } {
  if (couponsPerYear === 0) return { once: true };
  return { once: false, count: couponDates(maturity, couponsPerYear, settle).length, everyMonths: 12 / couponsPerYear };
}
