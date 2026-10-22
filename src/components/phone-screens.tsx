"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { maturityValue } from "@/lib/yields";
import { CountUp } from "./count-up";
import { LadderMark } from "./logo";

export type PhoneQuote = {
  id: string;
  currency: string;
  instrument: string;
  labelEn: string;
  labelAr: string;
  tenorMonths: number;
  yieldPct: number;
  couponsPerYear: number;
  asOf: string;
};

type Props = {
  locale: "ar" | "en";
  brand: string;
  switchTo: string;
  currencyName: string;
  phoneTitle: string;
  cta: string;
  atMaturity: string;
  couponLabels: Record<number, string>;
  t: Dictionary["phone"];
  rates: PhoneQuote[]; // the first currency on the yields board
  egpBills: PhoneQuote[]; // EGP T-bills, shortest first
};

const SCREENS = ["rates", "payments", "portfolio", "buy"] as const;
type Screen = (typeof SCREENS)[number];
const ROTATE_MS = 4500;

const money = (n: number, ccy: string, digits = 0) =>
  `${ccy} ${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function shortDate(d: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(d);
}

/** An app-like phone that cycles through what AGYAL will do: rates, payments, portfolio, buying. */
export function PhoneScreens(props: Props) {
  const [active, setActive] = useState<Screen>("rates");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((s) => SCREENS[(SCREENS.indexOf(s) + 1) % SCREENS.length]);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="grid justify-items-center gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="float relative w-[17.5rem] sm:w-[19rem]">
        <div className="rounded-[3rem] bg-[#1b1c1e] p-2.5 shadow-[0_40px_80px_-30px_rgba(15,22,48,.55)] ring-1 ring-white/10">
          <div className="relative h-[34rem] overflow-hidden rounded-[2.5rem] bg-paper">
            <div className="absolute start-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black rtl:translate-x-1/2" />
            <div className="flex h-full flex-col gap-3 px-4 pb-5 pt-12">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <LadderMark className="h-5 w-5" animated />
                  {props.brand}
                </span>
                <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] text-muted">{props.switchTo}</span>
              </div>
              <div key={active} className="screen-in flex min-h-0 flex-1 flex-col gap-3" aria-live="polite">
                {active === "rates" && <Rates {...props} />}
                {active === "payments" && <Payments {...props} />}
                {active === "portfolio" && <Portfolio {...props} />}
                {active === "buy" && <Buy {...props} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="App screens" className="flex gap-1 rounded-full bg-ink/5 p-1 text-xs">
        {SCREENS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === active}
            onClick={() => setActive(s)}
            className={`rounded-full px-3 py-1.5 transition ${s === active ? "bg-card font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {props.t.tabs[s]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Title({ small, big, tag }: { small: string; big: string; tag?: string }) {
  return (
    <div className="flex items-end justify-between gap-2">
      <div>
        <div className="text-xs text-muted">{small}</div>
        <div className="text-lg font-bold">{big}</div>
      </div>
      {tag && <span className="mb-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">{tag}</span>}
    </div>
  );
}

function Rates({ rates, locale, phoneTitle, currencyName, atMaturity, couponLabels, cta }: Props) {
  const cards = rates.slice(0, 4);
  return (
    <>
      <Title small={phoneTitle} big={currencyName} />
      <div className="grid grid-cols-2 gap-2">
        {cards.map((q, i) => (
          <div key={q.id} className={`grid gap-0.5 rounded-2xl bg-card p-3 shadow-sm ${cards.length % 2 && i === cards.length - 1 ? "col-span-2" : ""}`}>
            <span className="truncate text-[11px] text-muted">{locale === "ar" ? q.labelAr : q.labelEn}</span>
            <span className="text-2xl font-bold tracking-tight">
              <CountUp value={q.yieldPct} />
              <span className="text-sm font-semibold text-muted">%</span>
            </span>
            <span className="text-[10px] font-semibold text-primary">
              {q.couponsPerYear === 0 ? atMaturity : couponLabels[q.couponsPerYear]}
            </span>
          </div>
        ))}
      </div>
      <MiniCurve />
      <div className="mt-auto rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-onprimary">{cta}</div>
    </>
  );
}

function Payments({ egpBills, locale, t }: Props) {
  // Sample holdings: EGP 100,000 in each T-bill, plus USD 10,000 of the 8.625% Eurobond 2030 (pays 4 Feb / 4 Aug).
  const rows = [
    ...egpBills.slice(0, 2).map((q) => {
      const days = Math.round((q.tenorMonths * 365) / 12);
      return {
        key: q.id,
        date: addDays(q.asOf, days),
        label: locale === "ar" ? q.labelAr : q.labelEn,
        kind: t.payments.matures,
        amount: money(maturityValue(100_000, q.yieldPct, days), "EGP"),
      };
    }),
    { key: "eb30", date: new Date("2027-02-04T12:00:00Z"), label: locale === "ar" ? "يوروبوند 2030" : "Eurobond 2030", kind: t.payments.coupon, amount: money(431.25, "USD", 2) },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <>
      <Title small={t.payments.next} big={t.payments.title} tag={t.sample} />
      <ol className="grid gap-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-center leading-none text-primary">
              <span className="num text-base font-bold">{r.date.getUTCDate()}</span>
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="text-xs font-semibold">{r.label}</span>
              <span className="text-[10px] text-muted">
                {r.kind} · {shortDate(r.date, locale)}
              </span>
              <span className="num w-fit text-xs font-bold text-primary">{r.amount}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

function Portfolio({ t, locale }: Props) {
  // Sample figures for the illustration only.
  const months = [9.8, 12.4, 10.1, 15.6, 13.2, 18.9];
  const max = Math.max(...months);
  const holdings = [
    { name: locale === "ar" ? "أذون الخزانة" : "T-bills", value: "EGP 640,000", w: 50 },
    { name: locale === "ar" ? "السندات" : "Bonds", value: "EGP 420,000", w: 33 },
    { name: locale === "ar" ? "اليوروبوند" : "Eurobonds", value: "USD 4,600", w: 17 },
  ];
  return (
    <>
      <Title small={t.portfolio.value} big="EGP 1,284,500" tag={t.sample} />
      <div className="grid gap-2 rounded-2xl bg-card p-3 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-muted">{t.portfolio.income}</span>
          <span className="num text-sm font-bold text-primary">EGP 186,200</span>
        </div>
        <div className="flex h-16 items-end gap-1.5" style={{ direction: "ltr" }} aria-hidden>
          {months.map((m, i) => (
            <span key={i} className={`flex-1 rounded-md ${i === months.length - 1 ? "bg-accent" : "bg-primary/70"}`} style={{ height: `${(m / max) * 100}%` }} />
          ))}
        </div>
        <span className="text-[10px] text-muted">{t.portfolio.monthly}</span>
      </div>
      <div className="grid gap-1.5 rounded-2xl bg-card p-3 shadow-sm">
        <div className="flex h-2 overflow-hidden rounded-full">
          {holdings.map((h, i) => (
            <span key={h.name} style={{ width: `${h.w}%` }} className={i === 0 ? "bg-primary" : i === 1 ? "bg-primary/55" : "bg-accent"} />
          ))}
        </div>
        {holdings.map((h) => (
          <div key={h.name} className="flex justify-between text-[11px]">
            <span className="text-muted">{h.name}</span>
            <span className="num font-semibold">{h.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm">
        <span className="flex items-center gap-2 text-xs font-semibold">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
            <path d="M14 3v5h5M9 13h6M9 17h4" />
          </svg>
          {t.portfolio.statement}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t.portfolio.pdf}</span>
      </div>
    </>
  );
}

function Buy({ egpBills, locale, t }: Props) {
  const q = egpBills.at(-1);
  if (!q) return null;
  const amount = 50_000;
  const days = q.tenorMonths >= 12 ? 364 : Math.round((q.tenorMonths * 365) / 12);
  return (
    <>
      <Title small={t.buy.title} big={locale === "ar" ? q.labelAr : q.labelEn} />
      <div className="grid gap-1 rounded-2xl bg-card p-4 text-center shadow-sm">
        <span className="text-[11px] text-muted">{t.buy.amount}</span>
        <span className="num text-3xl font-bold tracking-tight">{money(amount, "EGP")}</span>
      </div>
      <div className="grid gap-2 rounded-2xl bg-card p-3 text-xs shadow-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t.buy.yield}</span>
          <span className="num font-semibold">{q.yieldPct.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">
            {t.buy.receive} {shortDate(addDays(q.asOf, days), locale)}
          </span>
          <span className="num font-bold text-primary">{money(maturityValue(amount, q.yieldPct, days), "EGP")}</span>
        </div>
        <span className="text-[10px] text-muted">{t.buy.beforeTax}</span>
      </div>
      <div className="mt-auto rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-onprimary">{t.buy.review}</div>
    </>
  );
}

/** A small yield-curve sparkline: short tenors on the left, long on the right. */
function MiniCurve() {
  return (
    <svg viewBox="0 0 240 64" className="h-16 w-full" style={{ direction: "ltr" }} aria-hidden>
      <defs>
        <linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--primary))" stopOpacity=".25" />
          <stop offset="1" stopColor="rgb(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[16, 32, 48].map((y) => (
        <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="rgb(var(--line))" strokeWidth="1" />
      ))}
      <path d="M0 50 C 40 40, 80 26, 120 22 S 200 12, 240 10 L 240 64 L 0 64 Z" fill="url(#curveFill)" />
      <path d="M0 50 C 40 40, 80 26, 120 22 S 200 12, 240 10" fill="none" stroke="rgb(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="236" cy="10.5" r="4" fill="rgb(var(--accent))" />
    </svg>
  );
}
