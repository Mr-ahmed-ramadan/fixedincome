"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/locale";
import { CURRENCIES, type Currency } from "@/lib/yields";
import { TradeButtons, TradeDialog, type TradeLabels, type TradeRequest } from "./trade-dialog";
import type { JoinLabels } from "./waitlist-form";

export type RateRow = {
  id: string;
  name: string;
  instrument: string;
  bucket: string; // already translated, e.g. "0–1y"
  yieldPct: number;
  couponRatePct: number | null;
  couponsPerYear: number;
  years: number;
  maturity: string; // formatted
  asOf: string; // formatted
};
export type RateGroup = { currency: Currency; rows: RateRow[] };

type Labels = {
  currencies: Record<Currency, string>;
  types: Record<string, string>;
  tenor: string;
  security: string;
  coupon: string;
  pays: string;
  years: string;
  maturity: string;
  yield: string;
  trade: string;
  noCoupon: string;
  atMaturity: string;
  yrs: string;
  perYear: Record<number, string>;
  asOf: string;
  empty: string;
  tap: string;
  soon: string;
  note: string;
};

// Desktop columns: tenor · security · coupon · pays · years · maturity · yield · buy/sell.
const COLS = "md:grid-cols-[5.5rem_minmax(0,1.7fr)_5.5rem_6.5rem_4rem_7.5rem_5.5rem_8.5rem]";

export function RatesTable(p: { groups: RateGroup[]; labels: Labels; trade: TradeLabels; join: JoinLabels; google: boolean; locale: Locale }) {
  const { groups, labels: L, locale } = p;
  const [active, setActive] = useState<Currency | undefined>(groups[0]?.currency);
  const [request, setRequest] = useState<TradeRequest | null>(null);

  // Coming back from a security page (?ccy=USD#yields) reopens that currency.
  useEffect(() => {
    const ccy = new URLSearchParams(window.location.search).get("ccy");
    if (ccy && (CURRENCIES as readonly string[]).includes(ccy) && groups.some((g) => g.currency === ccy)) setActive(ccy as Currency);
  }, [groups]);

  const group = groups.find((g) => g.currency === active);
  if (!group) return <p className="rounded-3xl bg-card p-8 text-center text-muted">{L.empty}</p>;

  const pays = (r: RateRow) => (r.couponsPerYear === 0 ? L.atMaturity : L.perYear[r.couponsPerYear] ?? `${r.couponsPerYear}×`);
  const coupon = (r: RateRow) => (r.couponRatePct != null ? `${r.couponRatePct}%` : r.couponsPerYear === 0 ? "—" : "");

  return (
    <div className="grid gap-3">
      {groups.length > 1 && (
        <div role="tablist" aria-label="Currency" className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-ink/5 p-1">
          {groups.map((g) => (
            <button
              key={g.currency}
              role="tab"
              type="button"
              aria-selected={g.currency === active}
              onClick={() => setActive(g.currency)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${g.currency === active ? "bg-card font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              <span className="font-semibold">{g.currency}</span>
              <span className="ms-1.5 hidden sm:inline">{L.currencies[g.currency]}</span>
              <span className="num ms-1.5 rounded-full bg-ink/5 px-1.5 text-xs">{g.rows.length}</span>
            </button>
          ))}
        </div>
      )}

      <div role="tabpanel" className="overflow-hidden md:rounded-3xl md:bg-card md:ring-1 md:ring-line/60">
        <div className={`hidden gap-3 border-b border-line px-5 py-3 text-xs font-medium text-muted md:grid ${COLS}`} aria-hidden>
          <span>{L.tenor}</span>
          <span>{L.security}</span>
          <span>{L.coupon}</span>
          <span>{L.pays}</span>
          <span className="text-end">{L.years}</span>
          <span>{L.maturity}</span>
          <span className="text-end">{L.yield}</span>
          <span className="text-end">{L.trade}</span>
        </div>
        <ul className="grid gap-2 md:gap-0">
          {group.rows.map((r) => (
            <li
              key={r.id}
              className={`relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-2xl bg-card p-3.5 ring-1 ring-line/60 transition hover:ring-primary/40 md:gap-y-0 md:rounded-none md:px-5 md:py-3 md:ring-0 md:hover:bg-primary/[.04] md:[&:not(:last-child)]:border-b md:[&:not(:last-child)]:border-line/70 ${COLS}`}
            >
              <span className="hidden text-sm font-semibold md:block">{r.bucket}</span>
              {/* Phones: name and details on the left (two rows), yield above Buy/Sell on the right. */}
              <span className="row-span-2 grid min-w-0 gap-1 md:row-span-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded-md bg-ink/5 px-1.5 py-0.5 text-[11px] font-semibold md:hidden">{r.bucket}</span>
                  <a
                    href={`/${locale}/securities/${r.id}`}
                    className="truncate font-semibold after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-primary md:after:rounded-none"
                  >
                    {r.name}
                  </a>
                </span>
                <span className="text-xs text-muted md:hidden">
                  {r.couponsPerYear === 0 ? `${L.noCoupon} · ${L.atMaturity}` : `${L.coupon} ${coupon(r)} · ${pays(r)}`} · <span className="num">{r.years.toFixed(1)}</span> {L.yrs}
                </span>
                <span className="hidden text-xs text-muted md:block">{L.types[r.instrument] ?? r.instrument}</span>
              </span>
              <span className="num hidden text-sm md:block">{coupon(r)}</span>
              <span className="hidden text-sm md:block">{pays(r)}</span>
              <span className="num hidden text-end text-sm md:block">{r.years.toFixed(1)}</span>
              <span className="hidden text-sm md:block">{r.maturity}</span>
              <span className="num row-span-1 text-end text-2xl font-bold tracking-tight text-primary md:text-xl">
                {r.yieldPct.toFixed(2)}
                <span className="text-sm text-accent">%</span>
              </span>
              <TradeButtons
                labels={p.trade}
                className="justify-end"
                onTrade={(side) => setRequest((q) => ({ name: r.name, side, n: (q?.n ?? 0) + 1 }))}
              />
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">
        {L.tap} {L.asOf} {[...new Set(group.rows.map((r) => r.asOf))].join(" · ")}.
      </p>
      <p className="w-fit rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium text-muted">{L.soon}</p>
      <p className="max-w-3xl text-xs text-muted">{L.note}</p>
      <TradeDialog request={request} onClose={() => setRequest(null)} labels={p.trade} locale={locale} join={p.join} google={p.google} />
    </div>
  );
}
