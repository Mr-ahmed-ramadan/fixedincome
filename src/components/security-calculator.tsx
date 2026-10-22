"use client";

import { useMemo, useState } from "react";
import { buildSchedule } from "@/lib/schedule";

type Labels = {
  yieldLabel: string;
  amount: string;
  minimum: string;
  term: string;
  years: string;
  maturity: string;
  price: string;
  face: string;
  totalReturn: string;
  getBack: string;
  afterTax: string | null;
  estimate: string;
  chartLabel: string;
  legendCoupon: string;
  legendPrincipal: string;
  scheduleTitle: string;
  scheduleFor: string;
  date: string;
  payment: string;
  coupon: string;
  finalCoupon: string;
  principal: string;
};

type Props = {
  locale: "ar" | "en";
  currency: string;
  yieldPct: number;
  couponsPerYear: number;
  couponRatePct: number | null;
  taxRatePct: number | null;
  maturityIso: string;
  settleIso: string;
  minInvestment: number | null;
  defaultAmount: number;
  labels: Labels;
};

const fmt = (n: number, digits = 0) => n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function longDate(d: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Cairo" }).format(d);
}

/** Type an amount and see the term, the payout and every payment date. */
export function SecurityCalculator(p: Props) {
  const [raw, setRaw] = useState(fmt(p.defaultAmount));
  const amount = Number(raw.replace(/[^\d.]/g, "")) || 0;
  const maturity = new Date(p.maturityIso);
  const settle = new Date(p.settleIso);

  const s = useMemo(
    () => buildSchedule({ amount, yieldPct: p.yieldPct, couponsPerYear: p.couponsPerYear, couponRatePct: p.couponRatePct, maturity, settle }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amount, p.yieldPct, p.couponsPerYear, p.couponRatePct, p.maturityIso, p.settleIso],
  );
  const taxRate = p.taxRatePct;
  const afterTaxReturn = taxRate != null ? s.totalReturn * (1 - taxRate / 100) : null;
  const tooSmall = p.minInvestment != null && amount > 0 && amount < p.minInvestment;
  const money = (n: number, digits = 0) => `${p.currency} ${fmt(n, digits)}`;
  const L = p.labels;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <section className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-line/60 sm:p-6">
        <div className="grid gap-1">
          <span className="text-sm font-medium text-muted">{L.yieldLabel}</span>
          <span className="num text-5xl font-bold tracking-tight text-primary">
            {p.yieldPct.toFixed(2)}
            <span className="text-2xl text-accent">%</span>
          </span>
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-ink/80">
            {L.amount} ({p.currency})
          </span>
          <input
            id="amount"
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={() => setRaw(fmt(amount))}
            dir="ltr"
            className="field num text-lg font-semibold rtl:text-right"
          />
          {p.minInvestment != null && (
            <span className={`text-xs ${tooSmall ? "font-semibold text-accent" : "text-muted"}`}>
              {L.minimum}: <span className="num">{money(p.minInvestment)}</span>
            </span>
          )}
        </label>
        <dl className="grid gap-3 border-t border-line pt-4 text-sm">
          <Row k={L.term} v={<span className="num">{s.years.toFixed(1)} {L.years}</span>} />
          <Row k={L.maturity} v={longDate(maturity, p.locale)} />
          <Row k={L.price} v={<span className="num">{s.pricePer100.toFixed(2)}</span>} />
          {p.couponsPerYear > 0 && <Row k={L.face} v={<span className="num">{money(s.faceValue)}</span>} />}
          <Row k={L.totalReturn} v={<span className="num text-base font-bold text-primary">+{money(s.totalReturn)}</span>} />
          <Row k={L.getBack} v={<span className="num text-lg font-bold">{money(s.totalReceived)}</span>} />
          {L.afterTax && afterTaxReturn != null && (
            <Row k={L.afterTax} v={<span className="num font-semibold">+{money(afterTaxReturn)}</span>} />
          )}
        </dl>
        <p className="text-xs text-muted">{L.estimate}</p>
      </section>

      <section className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-line/60 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{L.scheduleTitle}</h2>
          <span className="text-xs text-muted">
            {L.scheduleFor}: <span className="num">{money(amount)}</span>
          </span>
        </div>
        <PaymentChart payments={s.payments} locale={p.locale} labels={L} />
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-xs text-muted">
              <tr>
                <th className="py-2 text-start font-medium">{L.date}</th>
                <th className="py-2 text-start font-medium">{L.payment}</th>
                <th className="py-2 text-end font-medium">{p.currency}</th>
              </tr>
            </thead>
            <tbody>
              {s.payments.map((pay, i) => {
                const last = i === s.payments.length - 1;
                const label = p.couponsPerYear === 0 ? L.principal : last ? L.finalCoupon : `${L.coupon} ${i + 1}`;
                return (
                  <tr key={pay.date.toISOString()} className={`border-t border-line ${last ? "font-semibold" : ""}`}>
                    <td className="whitespace-nowrap py-2.5 pe-3">{longDate(pay.date, p.locale)}</td>
                    <td className="py-2.5 pe-3">{label}</td>
                    <td className={`num whitespace-nowrap py-2.5 text-end ${last ? "text-primary" : ""}`}>{fmt(pay.total, pay.total < 1000 ? 2 : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-end">{v}</dd>
    </div>
  );
}

/**
 * One bar per payment, in date order (right to left in Arabic). Coupons are
 * drawn short and the final payment tall, since it returns the principal; the
 * exact amounts are in the table below.
 */
function PaymentChart({ payments, locale, labels }: { payments: { date: Date; coupon: number; principal: number }[]; locale: "ar" | "en"; labels: Labels }) {
  if (payments.length === 0) return null;
  const year = (d: Date) => d.getUTCFullYear();
  const first = payments[0].date;
  const last = payments[payments.length - 1].date;
  const hasCoupons = payments.some((x) => x.coupon > 0);
  return (
    <figure className="grid gap-2" aria-label={labels.chartLabel}>
      <div className="flex h-24 items-end gap-[3px] border-b border-line" role="img" aria-label={`${labels.chartLabel}: ${payments.length}`}>
        {payments.map((pay) => (
          <span
            key={pay.date.toISOString()}
            title={longDate(pay.date, locale)}
            className="flex h-full max-w-6 min-w-[2px] flex-1 flex-col justify-end"
          >
            {pay.principal > 0 && <span className="h-[78%] rounded-t-sm bg-primary" />}
            {pay.coupon > 0 && <span className={`h-[22%] bg-accent ${pay.principal > 0 ? "" : "rounded-t-sm"}`} />}
          </span>
        ))}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="num">{payments.length > 1 ? year(first) : longDate(first, locale)}</span>
        <span className="flex gap-3">
          {hasCoupons && (
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" />{labels.legendCoupon}</span>
          )}
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />{labels.legendPrincipal}</span>
        </span>
        {payments.length > 1 && <span className="num">{year(last)}</span>}
      </figcaption>
    </figure>
  );
}
