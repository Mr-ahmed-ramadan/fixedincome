"use client";

import { useState } from "react";
import type { Currency, Quote } from "@/lib/yields";
import { CountUp } from "./count-up";

type Labels = {
  currencies: Record<Currency, string>;
  atMaturity: string;
  couponLabels: Record<number, string>;
  asOf: string;
  empty: string;
  bankEq: string;
};

// Wide screens: up to four cards in one row; six or nine fill rows of three.
const LG_COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
const lgCols = (n: number) => LG_COLS[n <= 4 ? n : n % 3 === 0 ? 3 : 4];

export type BoardGroup = { currency: Currency; quotes: (Quote & { asOfLabel: string })[] };

export function YieldsBoard({ groups, labels, locale }: { groups: BoardGroup[]; labels: Labels; locale: "ar" | "en" }) {
  const [active, setActive] = useState<Currency | undefined>(groups[0]?.currency);
  const group = groups.find((g) => g.currency === active);

  if (!group) return <p className="rounded-3xl bg-card p-8 text-center text-muted">{labels.empty}</p>;

  return (
    <div className="grid gap-6">
      {groups.length > 1 && (
        <div role="tablist" aria-label="Currency" className="inline-flex w-fit gap-1 rounded-full bg-ink/5 p-1">
          {groups.map((g) => (
            <button
              key={g.currency}
              role="tab"
              type="button"
              aria-selected={g.currency === active}
              onClick={() => setActive(g.currency)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                g.currency === active ? "bg-card font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <span className="me-1.5 font-semibold">{g.currency}</span>
              <span className="hidden sm:inline">{labels.currencies[g.currency]}</span>
            </button>
          ))}
        </div>
      )}

      <div role="tabpanel" className={`grid grid-cols-2 gap-3 sm:gap-4 ${lgCols(group.quotes.length)}`}>
        {group.quotes.map((q, i) => (
          <a
            key={q.id}
            href={`/${locale}/securities/${q.id}`}
            className={`${group.quotes.length % 2 && i === group.quotes.length - 1 ? "col-span-2 lg:col-span-1" : ""} group grid gap-3 rounded-3xl bg-card p-4 shadow-[0_1px_2px_rgba(15,22,48,.04)] ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40 sm:p-6`}
          >
            <h3 className="flex items-start justify-between gap-2 text-sm font-medium text-muted sm:text-base">
              {locale === "ar" ? q.labelAr : q.labelEn}
              <span aria-hidden className="text-primary/60 transition group-hover:text-primary rtl:-scale-x-100">›</span>
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight sm:text-5xl">
                <CountUp value={q.yieldPct} />
              </span>
              <span className="text-lg font-semibold text-muted sm:text-2xl">%</span>
            </div>
            <div className="grid gap-1 text-xs sm:text-sm">
              <span className="font-semibold text-primary">
                {q.couponsPerYear === 0 ? labels.atMaturity : labels.couponLabels[q.couponsPerYear]}
              </span>
              {q.bankRatePct != null && (
                <span className="text-muted">
                  {labels.bankEq} <span className="num font-semibold text-ink/70">{q.bankRatePct.toFixed(2)}%</span>
                </span>
              )}
              <span className="text-muted">
                {labels.asOf} {q.asOfLabel}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
