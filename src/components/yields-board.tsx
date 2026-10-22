"use client";

import { useEffect, useState } from "react";
import { CURRENCIES, INSTRUMENTS, type Currency, type Quote } from "@/lib/yields";
import { CountUp } from "./count-up";

type Labels = {
  currencies: Record<Currency, string>;
  atMaturity: string;
  couponLabels: Record<number, string>;
  types: Record<string, string>;
  asOf: string;
  empty: string;
  bankEq: string;
  soon: string;
};

// Wide screens: up to four cards in one row; six or nine fill rows of three.
const LG_COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
const lgCols = (n: number) => LG_COLS[n <= 4 ? n : n % 3 === 0 ? 3 : 4];

export type BoardGroup = { currency: Currency; quotes: (Quote & { asOfLabel: string })[] };

export function YieldsBoard({ groups, labels, locale }: { groups: BoardGroup[]; labels: Labels; locale: "ar" | "en" }) {
  const [active, setActive] = useState<Currency | undefined>(groups[0]?.currency);

  // Coming back from a security page (?ccy=USD#yields) reopens that currency.
  useEffect(() => {
    const ccy = new URLSearchParams(window.location.search).get("ccy");
    if (ccy && (CURRENCIES as readonly string[]).includes(ccy) && groups.some((g) => g.currency === ccy)) setActive(ccy as Currency);
  }, [groups]);

  const group = groups.find((g) => g.currency === active);
  if (!group) return <p className="rounded-3xl bg-card p-8 text-center text-muted">{labels.empty}</p>;

  // Within a currency, one block per kind of security, so how each one pays is obvious.
  const kinds = INSTRUMENTS.map((k) => ({ kind: k, quotes: group.quotes.filter((q) => q.instrument === k) })).filter((k) => k.quotes.length);

  return (
    <div className="grid gap-6">
      {groups.length > 1 && (
        <div role="tablist" aria-label="Currency" className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-ink/5 p-1">
          {groups.map((g) => (
            <button
              key={g.currency}
              role="tab"
              type="button"
              aria-selected={g.currency === active}
              onClick={() => setActive(g.currency)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                g.currency === active ? "bg-card font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <span className="font-semibold">{g.currency}</span>
              <span className="ms-1.5 hidden sm:inline">{labels.currencies[g.currency]}</span>
              <span className="num ms-1.5 rounded-full bg-ink/5 px-1.5 text-xs">{g.quotes.length}</span>
            </button>
          ))}
        </div>
      )}

      <div role="tabpanel" className="grid gap-8">
        {kinds.map(({ kind, quotes }) => {
          const pays = quotes[0].couponsPerYear === 0 ? labels.atMaturity : labels.couponLabels[quotes[0].couponsPerYear];
          const samePay = quotes.every((q) => q.couponsPerYear === quotes[0].couponsPerYear);
          return (
            <div key={kind} className="grid gap-3">
              <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-lg font-semibold">{labels.types[kind] ?? kind}</span>
                {samePay && <span className="text-sm text-muted">{pays}</span>}
              </h3>
              <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${lgCols(quotes.length)}`}>
                {quotes.map((q, i) => (
                  <Card key={q.id} q={q} locale={locale} labels={labels} wide={quotes.length % 2 === 1 && i === quotes.length - 1} />
                ))}
              </div>
            </div>
          );
        })}
        <p className="w-fit rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium text-muted">{labels.soon}</p>
      </div>
    </div>
  );
}

function Card({ q, locale, labels, wide }: { q: BoardGroup["quotes"][number]; locale: "ar" | "en"; labels: Labels; wide: boolean }) {
  const once = q.couponsPerYear === 0;
  return (
    <a
      href={`/${locale}/securities/${q.id}`}
      className={`${wide ? "col-span-2 lg:col-span-1" : ""} group grid gap-3 rounded-3xl bg-card p-4 shadow-[0_1px_2px_rgba(15,22,48,.04)] ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40 sm:p-6`}
    >
      <span className="flex items-start justify-between gap-2 text-sm font-medium text-muted sm:text-base">
        {locale === "ar" ? q.labelAr : q.labelEn}
        <span aria-hidden className="text-primary/60 transition group-hover:text-primary rtl:-scale-x-100">›</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight sm:text-5xl">
          <CountUp value={q.yieldPct} />
        </span>
        <span className="text-lg font-semibold text-muted sm:text-2xl">%</span>
      </span>
      <span className="grid gap-1.5 text-xs sm:text-sm">
        <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold sm:text-xs ${once ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
          {once ? labels.atMaturity : labels.couponLabels[q.couponsPerYear]}
        </span>
        {q.bankRatePct != null && (
          <span className="text-muted">
            {labels.bankEq} <span className="num font-semibold text-ink/70">{q.bankRatePct.toFixed(2)}%</span>
          </span>
        )}
        <span className="text-muted">
          {labels.asOf} {q.asOfLabel}
        </span>
      </span>
    </a>
  );
}
