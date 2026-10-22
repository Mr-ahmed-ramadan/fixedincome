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
