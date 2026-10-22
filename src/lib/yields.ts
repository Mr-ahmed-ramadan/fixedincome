export const CURRENCIES = ["EGP", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const INSTRUMENTS = ["TBILL", "BOND", "SUKUK", "EUROBOND", "CORP"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export type Quote = {
  id: string;
  currency: string;
  instrument: string;
  labelEn: string;
  labelAr: string;
  tenorMonths: number;
  yieldPct: number;
  couponsPerYear: number;
  taxRatePct?: number | null;
  bankRatePct?: number | null;
  bankLabelEn?: string | null;
  bankLabelAr?: string | null;
  bankAsOf?: Date | string | null;
  sortOrder: number;
  asOf: Date | string;
};

/** Group active quotes by currency in display order, dropping empty currencies. */
export function groupByCurrency<T extends Quote>(quotes: T[]): { currency: Currency; quotes: T[] }[] {
  return CURRENCIES.map((currency) => ({
    currency,
    quotes: quotes
      .filter((q) => q.currency === currency)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.tenorMonths - b.tenorMonths),
  })).filter((g) => g.quotes.length > 0);
}

/** 24.15 → "24.15". Always Western digits so numbers read the same in both languages. */
export function formatYield(pct: number): string {
  return pct.toFixed(2);
}

export function formatAsOf(date: Date | string, locale: "ar" | "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(d);
}

/** What's left of the annual yield after withholding tax, or null when the tax treatment isn't set. */
export function afterTax(q: Pick<Quote, "yieldPct" | "taxRatePct">): number | null {
  if (q.taxRatePct == null) return null;
  return Math.round(q.yieldPct * (1 - q.taxRatePct / 100) * 100) / 100;
}

/**
 * Amount received at maturity on a discount instrument (T-bill) bought for
 * `amount`, using the simple-interest convention CBE quotes yields in.
 */
export function maturityValue(amount: number, yieldPct: number, days: number): number {
  return amount * (1 + (yieldPct / 100) * (days / 365));
}
