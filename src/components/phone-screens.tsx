"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { maturityValue } from "@/lib/yields";
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
  atMaturity: string;
  couponLabels: Record<number, string>;
  t: Dictionary["phone"];
  rates: PhoneQuote[]; // the first currency on the yields board
  egpBills: PhoneQuote[]; // EGP T-bills, shortest first
};

const SLIDES = ["home", "payments", "portfolio", "buy", "activity"] as const;
const ADVANCE_MS = 4500;
const SWIPE_PX = 40;

// ---------- small helpers ----------

const fmt = (n: number, digits = 0) => n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const money = (n: number, ccy: string, digits = 0) => `${ccy} ${fmt(n, digits)}`;

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

/** Deterministic pseudo-random numbers so server and browser draw the same first frame. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Runs `fn` every `ms` while `enabled`. */
function useTick(ms: number, enabled: boolean, fn: () => void) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [ms, enabled]);
}

/** Path for a line through `values`, scaled into a w×h box (LTR coordinates). */
function linePath(values: number[], w: number, h: number, pad = 4) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

// ---------- the phone ----------

/**
 * The AGYAL app as a swipeable carousel: Home, Payments, Portfolio, Buy and
 * Activity. Auto-advances, pauses while hovered or touched, and keeps its
 * figures gently moving so it feels live. Everything holds still for people
 * who prefer reduced motion.
 */
export function PhoneScreens(props: Props) {
  const { locale, t } = props;
  const rtl = locale === "ar";
  const reduced = usePrefersReducedMotion();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState<{ startX: number; dx: number } | null>(null);
  const [notify, setNotify] = useState(false);

  const go = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);

  useTick(ADVANCE_MS, !reduced && !paused && !drag, () => setIndex((i) => (i + 1) % SLIDES.length));

  // A coupon notification drops in every so often.
  useTick(11000, !reduced, () => {
    setNotify(true);
    window.setTimeout(() => setNotify(false), 3200);
  });

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ startX: e.clientX, dx: 0 });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (drag) setDrag({ ...drag, dx: e.clientX - drag.startX });
  }
  function onPointerUp() {
    if (!drag) return;
    const forward = rtl ? drag.dx > SWIPE_PX : drag.dx < -SWIPE_PX;
    const back = rtl ? drag.dx < -SWIPE_PX : drag.dx > SWIPE_PX;
    if (forward) go(index + 1);
    else if (back) go(index - 1);
    setDrag(null);
  }

  // The strip is 500% wide; one slide is 20% of it. RTL slides move the other way.
  const shift = (rtl ? 1 : -1) * index * (100 / SLIDES.length);
  const live = !reduced;

  return (
    <div
      className="grid justify-items-center gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="float relative w-[18rem] sm:w-[19.5rem]">
        <div className="rounded-[3rem] bg-[#1b1c1e] p-2.5 shadow-[0_40px_80px_-30px_rgba(15,22,48,.55)] ring-1 ring-white/10">
          <div className="relative h-[37rem] select-none overflow-hidden rounded-[2.5rem] bg-paper">
            {/* status bar + dynamic island */}
            <div className="absolute inset-x-0 top-0 z-20 flex h-10 items-center justify-between px-7 text-[11px] font-semibold" dir="ltr">
              <span className="num">9:41</span>
              <span className="flex items-center gap-1" aria-hidden>
                <svg viewBox="0 0 18 12" className="h-2.5 w-4 fill-current">
                  <rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
                </svg>
                <svg viewBox="0 0 26 12" className="h-2.5 w-5" fill="none" stroke="currentColor">
                  <rect x="0.5" y="0.5" width="22" height="11" rx="3" opacity=".4" /><rect x="2.5" y="2.5" width="16" height="7" rx="1.5" fill="currentColor" stroke="none" /><path d="M24.5 4v4" strokeLinecap="round" opacity=".4" />
                </svg>
              </span>
            </div>
            <div className="absolute start-1/2 top-2.5 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black rtl:translate-x-1/2" />

            {/* notification banner */}
            <div
              aria-hidden
              className={`absolute inset-x-3 top-11 z-30 flex items-center gap-2.5 rounded-2xl bg-card/95 p-2.5 shadow-lg ring-1 ring-line backdrop-blur transition-all duration-500 ${
                notify ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary">
                <LadderMark className="h-5 w-5 [&_rect]:fill-white" />
              </span>
              <span className="grid min-w-0 text-[11px] leading-tight">
                <b className="font-semibold">{props.brand}</b>
                <span className="truncate text-muted">{t.notification}</span>
              </span>
            </div>

            {/* the carousel */}
            <div
              className="absolute inset-x-0 bottom-[4.25rem] top-10 cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => setDrag(null)}
              role="region"
              aria-roledescription="carousel"
              aria-label={props.brand}
            >
              <div
                className={`flex h-full w-[500%] ${drag ? "" : "transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"}`}
                style={{ transform: `translateX(calc(${shift}% + ${drag?.dx ?? 0}px))` }}
              >
                {SLIDES.map((s, i) => (
                  <div
                    key={s}
                    className="flex h-full w-1/5 flex-col gap-3 overflow-hidden px-4 pb-6 pt-3"
                    aria-hidden={i !== index}
                    aria-roledescription="slide"
                  >
                    {s === "home" && <Home {...props} active={i === index} live={live} />}
                    {s === "payments" && <Payments {...props} active={i === index} />}
                    {s === "portfolio" && <Portfolio {...props} active={i === index} live={live} />}
                    {s === "buy" && <Buy {...props} active={i === index} live={live} />}
                    {s === "activity" && <Activity {...props} active={i === index} />}
                  </div>
                ))}
              </div>
            </div>

            {/* page dots */}
            <div className="absolute inset-x-0 bottom-[4.6rem] z-10 flex justify-center gap-1.5">
              {SLIDES.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t.tabs[s]}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-4 bg-ink/70" : "w-1.5 bg-ink/20"}`}
                />
              ))}
            </div>

            {/* tab bar */}
            <nav className="absolute inset-x-0 bottom-0 z-10 grid h-[4.25rem] grid-cols-5 border-t border-line/70 bg-card/90 px-2 pb-3 pt-1.5 backdrop-blur" aria-hidden>
              {SLIDES.map((s, i) => (
                <span key={s} className={`grid justify-items-center gap-0.5 text-[9px] transition-colors ${i === index ? "font-semibold text-primary" : "text-muted"}`}>
                  <TabIcon name={s} />
                  {t.tabs[s]}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">{t.caption}</p>
    </div>
  );
}

// ---------- slides ----------

type SlideProps = Props & { active: boolean; live?: boolean };

function Header({ small, big, right }: { small: string; big: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-2">
      <div className="min-w-0">
        <div className="truncate text-[11px] text-muted">{small}</div>
        <div className="truncate text-lg font-bold">{big}</div>
      </div>
      {right}
    </div>
  );
}

/** Home: today's yields, ticking a basis point or two either way, plus the live yield curve. */
function Home({ rates, locale, t, brand, atMaturity, couponLabels, active, live }: SlideProps) {
  const cards = rates.slice(0, 4);
  // Drift in basis points from the published yield, the last move per card, and a short history for each sparkline.
  const [state, setState] = useState(() => ({
    drift: cards.map(() => 0),
    moves: cards.map(() => ({ dir: 0, n: 0 })),
    history: cards.map((q, k) => {
      const r = seeded(k + 7);
      return Array.from({ length: 14 }, (_, i) => q.yieldPct - 0.4 + (i / 13) * 0.4 + (r() - 0.5) * 0.12);
    }),
  }));

  useTick(1700, Boolean(live && active && cards.length), () => {
    const k = Math.floor(Math.random() * cards.length);
    const step = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
    setState(({ drift, moves, history }) => {
      // Bounce back towards the published rate so the numbers never wander more than 4 bp.
      const next = Math.abs(drift[k] + step) > 4 ? drift[k] - step : drift[k] + step;
      const dir = Math.sign(next - drift[k]);
      return {
        drift: drift.map((v, i) => (i === k ? next : v)),
        moves: moves.map((m, i) => (i === k ? { dir, n: m.n + 1 } : m)),
        history: history.map((h, i) => (i === k ? [...h.slice(1), cards[k].yieldPct + next / 100] : h)),
      };
    });
  });
  const { drift, moves, history } = state;

  const curve = [...rates].sort((a, b) => a.tenorMonths - b.tenorMonths);
  const curveVals = curve.map((q) => q.yieldPct + (drift[cards.indexOf(q)] ?? 0) / 100);

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <LadderMark className="h-5 w-5" animated />
          {brand}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t.home.market}
        </span>
      </div>
      <Header small={t.home.hello} big={t.home.rates} />
      <div className="grid grid-cols-2 gap-2">
        {cards.map((q, k) => {
          const value = q.yieldPct + drift[k] / 100;
          const mv = moves[k];
          return (
            <div key={q.id} className="grid gap-0.5 rounded-2xl bg-card p-2.5 shadow-sm">
              <span className="truncate text-[10px] text-muted">{locale === "ar" ? q.labelAr : q.labelEn}</span>
              <span className="flex items-baseline gap-1">
                <span key={mv.n} className={`num text-xl font-bold tracking-tight ${mv.dir > 0 ? "flash-up" : mv.dir < 0 ? "flash-down" : ""}`}>
                  {value.toFixed(2)}
                  <span className="text-xs font-semibold text-muted">%</span>
                </span>
                {mv.dir !== 0 && (
                  <span className={`text-[10px] font-bold ${mv.dir > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {mv.dir > 0 ? "▲" : "▼"}
                  </span>
                )}
              </span>
              <svg viewBox="0 0 100 22" className="h-5 w-full" style={{ direction: "ltr" }} aria-hidden>
                <path d={linePath(history[k], 100, 22, 3)} fill="none" stroke="rgb(var(--primary))" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              <span className="truncate text-[9px] font-semibold text-primary">
                {q.couponsPerYear === 0 ? atMaturity : couponLabels[q.couponsPerYear]}
              </span>
            </div>
          );
        })}
      </div>
      {curve.length > 1 && (
        <div className="grid gap-1 rounded-2xl bg-card p-3 shadow-sm">
          <span className="text-[10px] text-muted">{t.home.curve}</span>
          <svg key={String(active)} viewBox="0 0 240 70" className="h-[4.5rem] w-full" style={{ direction: "ltr" }} aria-hidden>
            {[18, 36, 54].map((y) => (
              <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="rgb(var(--line))" strokeWidth="1" />
            ))}
            <path d={`${linePath(curveVals, 240, 62, 8)} L240 70 L0 70 Z`} fill="rgb(var(--primary) / .12)" />
            <path className="draw-line" d={linePath(curveVals, 240, 62, 8)} fill="none" stroke="rgb(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
            {curveVals.map((v, i) => {
              const min = Math.min(...curveVals);
              const span = Math.max(...curveVals) - min || 1;
              const x = (i / (curveVals.length - 1)) * 240;
              const y = 8 + (1 - (v - min) / span) * 46;
              return <circle key={i} cx={x} cy={y} r={i === curveVals.length - 1 ? 4 : 2.5} fill={i === curveVals.length - 1 ? "rgb(var(--accent))" : "rgb(var(--primary))"} />;
            })}
          </svg>
          <div className="flex justify-between text-[9px] text-muted" dir="ltr">
            {curve.map((q) => (
              <span key={q.id} className="num">{q.tenorMonths >= 12 ? `${q.tenorMonths / 12}Y` : `${q.tenorMonths}M`}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** Payments: countdown to the next payment and what's coming. */
function Payments({ egpBills, locale, t, active }: SlideProps) {
  // Sample holdings: EGP 100,000 in each T-bill, plus USD 10,000 of the 8.625% Eurobond 2030 (pays 4 Feb / 4 Aug).
  const rows = [
    ...egpBills.slice(0, 2).map((q) => {
      const days = q.tenorMonths >= 12 ? 364 : Math.round((q.tenorMonths * 365) / 12);
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

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const next = rows.find((r) => now == null || r.date.getTime() > now) ?? rows[0];
  const daysLeft = now == null ? 0 : Math.max(0, Math.ceil((next.date.getTime() - now) / 86_400_000));
  const progress = Math.max(0.08, 1 - daysLeft / 182);
  const C = 2 * Math.PI * 30;

  return (
    <>
      <Header small={t.payments.nextCoupon} big={t.payments.title} />
      <div className="flex items-center gap-3 rounded-2xl bg-primary p-3 text-onprimary shadow-sm">
        <svg viewBox="0 0 72 72" className="h-[4.5rem] w-[4.5rem] shrink-0 -rotate-90" aria-hidden>
          <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="6" />
          <circle
            key={String(active)}
            className="ring-fill"
            cx="36"
            cy="36"
            r="30"
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            style={{ "--ring-to": C * (1 - progress), strokeDashoffset: C * (1 - progress) } as React.CSSProperties}
          />
        </svg>
        <div className="grid min-w-0 gap-0.5">
          <span className="num text-2xl font-bold leading-none">{next.amount}</span>
          <span className="truncate text-[11px] opacity-80">{next.label}</span>
          <span className="text-[11px] font-semibold">{now == null ? "" : t.payments.inDays.replace("{n}", String(daysLeft))}</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-muted">{t.payments.upcoming}</span>
      <ol className="grid gap-2">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center gap-2.5 rounded-2xl bg-card p-2.5 shadow-sm" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-center leading-none text-primary">
              <span className="num text-sm font-bold">{r.date.getUTCDate()}</span>
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate text-[11px] font-semibold">{r.label}</span>
              <span className="truncate text-[10px] text-muted">
                {r.kind} · {shortDate(r.date, locale)}
              </span>
            </span>
            <span className="num shrink-0 text-[11px] font-bold text-primary">{r.amount}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

const PORTFOLIO_BASE = 1_284_500;
const PORTFOLIO_OPEN = PORTFOLIO_BASE - 1_850;
const MONTHLY_INCOME = [9.8, 12.4, 10.1, 15.6, 13.2, 18.9]; // EGP thousands, sample

/** Portfolio: value and chart moving gently, today's change, allocation donut. */
function Portfolio({ t, active, live }: SlideProps) {
  const [series, setSeries] = useState(() => {
    const r = seeded(42);
    let v = PORTFOLIO_BASE * 0.93;
    const pts = Array.from({ length: 27 }, () => (v += PORTFOLIO_BASE * 0.0026 + (r() - 0.45) * PORTFOLIO_BASE * 0.004));
    return [...pts, PORTFOLIO_BASE];
  });
  useTick(1500, Boolean(live && active), () => {
    setSeries((s) => {
      const last = s[s.length - 1];
      const nudge = (Math.random() - 0.45) * 1400;
      const next = Math.min(PORTFOLIO_BASE + 2500, Math.max(PORTFOLIO_BASE - 1500, last + nudge));
      return [...s.slice(1), next];
    });
  });
  const value = series[series.length - 1];
  // Change since this morning's valuation (sample), wobbling with the chart.
  const change = value - PORTFOLIO_OPEN;
  const up = change >= 0;

  const parts = [
    { label: t.portfolio.tbills, pct: 50, color: "rgb(var(--primary))" },
    { label: t.portfolio.bonds, pct: 33, color: "rgb(var(--primary) / .5)" },
    { label: t.portfolio.eurobonds, pct: 17, color: "rgb(var(--accent))" },
  ];
  const C = 2 * Math.PI * 22;
  let offset = 0;

  return (
    <>
      <Header small={t.portfolio.value} big={money(Math.round(value / 10) * 10, "EGP")} />
      <span className={`-mt-2 text-[11px] font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
        <span className="num">{up ? "▲ +" : "▼ −"}{money(Math.abs(Math.round(change)), "EGP")}</span> {t.portfolio.today}
      </span>
      <div className="rounded-2xl bg-card p-2 shadow-sm">
        <svg viewBox="0 0 240 90" className="h-24 w-full" style={{ direction: "ltr" }} aria-hidden>
          <defs>
            <linearGradient id="pf-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="rgb(var(--primary))" stopOpacity=".28" />
              <stop offset="1" stopColor="rgb(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${linePath(series, 240, 84, 6)} L240 90 L0 90 Z`} fill="url(#pf-fill)" className="transition-all duration-700" />
          <path d={linePath(series, 240, 84, 6)} fill="none" stroke="rgb(var(--primary))" strokeWidth="2.2" strokeLinejoin="round" className="transition-all duration-700" />
          {(() => {
            const min = Math.min(...series);
            const span = Math.max(...series) - min || 1;
            const y = 6 + (1 - (value - min) / span) * 72;
            return (
              <>
                <circle cx="240" cy={y} r="7" fill="rgb(var(--accent) / .25)" className="live-dot" />
                <circle cx="240" cy={y} r="3.5" fill="rgb(var(--accent))" />
              </>
            );
          })()}
        </svg>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
        <span key={String(active)} className="pop-in shrink-0">
        <svg viewBox="0 0 60 60" className="h-16 w-16 -rotate-90" aria-hidden>
          {parts.map((p) => {
            const len = (p.pct / 100) * C;
            const el = (
              <circle
                key={p.label}
                cx="30"
                cy="30"
                r="22"
                fill="none"
                stroke={p.color}
                strokeWidth="9"
                strokeDasharray={`${len - 1.5} ${C - len + 1.5}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        </span>
        <div className="grid flex-1 gap-1">
          <span className="text-[10px] text-muted">{t.portfolio.allocation}</span>
          {parts.map((p) => (
            <span key={p.label} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
              <span className="num font-semibold">{p.pct}%</span>
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-2 rounded-2xl bg-card p-3 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-muted">{t.portfolio.income}</span>
          <span className="num text-[11px] font-bold text-primary">EGP 186,200</span>
        </div>
        <div key={String(active)} className="flex h-10 items-end gap-1.5" style={{ direction: "ltr" }} aria-hidden>
          {MONTHLY_INCOME.map((m, i) => (
            <span
              key={i}
              className={`bar-rise flex-1 rounded ${i === MONTHLY_INCOME.length - 1 ? "bg-accent" : "bg-primary/70"}`}
              style={{ height: `${(m / Math.max(...MONTHLY_INCOME)) * 100}%`, animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

const BUY_AMOUNTS = [25_000, 50_000, 100_000];

/** Buy: an order ticket whose amount steps up while the payout recalculates. */
function Buy({ egpBills, locale, t, active, live }: SlideProps) {
  const q = egpBills.at(-1);
  const [step, setStep] = useState(1);
  useTick(1600, Boolean(live && active), () => setStep((s) => (s + 1) % BUY_AMOUNTS.length));
  if (!q) return null;

  const amount = BUY_AMOUNTS[step];
  const days = q.tenorMonths >= 12 ? 364 : Math.round((q.tenorMonths * 365) / 12);
  const receive = maturityValue(amount, q.yieldPct, days);

  return (
    <>
      <Header small={t.buy.title} big={locale === "ar" ? q.labelAr : q.labelEn} />
      <div className="grid gap-2 rounded-2xl bg-card p-4 text-center shadow-sm">
        <span className="text-[11px] text-muted">{t.buy.amount}</span>
        <span key={amount} className="num pop-in text-3xl font-bold tracking-tight">{money(amount, "EGP")}</span>
        <div className="relative mx-auto h-1.5 w-full rounded-full bg-ink/10" style={{ direction: "ltr" }} aria-hidden>
          <span className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500" style={{ width: `${(amount / 100_000) * 100}%` }} />
          <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card shadow ring-2 ring-primary transition-all duration-500" style={{ left: `${(amount / 100_000) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-muted" dir="ltr">
          {BUY_AMOUNTS.map((a) => (
            <span key={a} className="num">{fmt(a / 1000)}k</span>
          ))}
        </div>
      </div>
      <div className="grid gap-2 rounded-2xl bg-card p-3 text-[11px] shadow-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t.buy.yield}</span>
          <span className="num font-semibold">{q.yieldPct.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t.buy.price}</span>
          <span className="num font-semibold">{(100 / (1 + (q.yieldPct / 100) * (days / 365))).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t.buy.maturity}</span>
          <span className="font-semibold">{shortDate(addDays(q.asOf, days), locale)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
          <span className="min-w-0 text-muted">{t.buy.receive}</span>
          <span key={receive} className="num pop-in shrink-0 whitespace-nowrap text-sm font-bold text-primary">{money(receive, "EGP")}</span>
        </div>
        <span className="text-[10px] text-muted">
          {t.buy.beforeTax} · {t.buy.settles}
        </span>
      </div>
      <div className="mt-auto rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-onprimary shadow-[0_8px_20px_-8px_rgb(var(--primary))]">
        {t.buy.review}
      </div>
    </>
  );
}

/** Activity: recent movements and the monthly statement. */
function Activity({ t, locale }: SlideProps) {
  const d = (iso: string) => shortDate(new Date(`${iso}T12:00:00Z`), locale);
  const items = [
    { label: t.activity.couponIn, sub: locale === "ar" ? "يوروبوند 2030" : "Eurobond 2030", amount: "+ USD 431.25", up: true, date: d("2026-08-04") },
    { label: t.activity.matured, sub: locale === "ar" ? "أذون خزانة 3 شهور" : "3-month T-bill", amount: "+ EGP 105,959", up: true, date: d("2026-07-14") },
    { label: t.activity.bought, sub: locale === "ar" ? "أذون خزانة 12 شهر" : "12-month T-bill", amount: "− EGP 50,000", up: false, date: d("2026-07-02") },
    { label: t.activity.couponIn, sub: locale === "ar" ? "سندات خزانة 3 سنوات" : "3-year T-bond", amount: "+ EGP 11,990", up: true, date: d("2026-06-20") },
  ];
  return (
    <>
      <Header small={t.activity.period} big={t.activity.title} />
      <ol className="grid gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2.5 rounded-2xl bg-card p-2.5 shadow-sm">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${it.up ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {it.up ? <path d="M12 19V5M6 11l6-6 6 6" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
              </svg>
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate text-[11px] font-semibold">{it.label}</span>
              <span className="truncate text-[10px] text-muted">{it.sub}</span>
            </span>
            <span className="grid shrink-0 justify-items-end gap-0.5">
              <span className={`num whitespace-nowrap text-[10px] font-bold ${it.up ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{it.amount}</span>
              <span className="num text-[9px] text-muted">{it.date}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm">
        <span className="flex items-center gap-2 text-[11px] font-semibold">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
            <path d="M14 3v5h5M9 13h6M9 17h4" />
          </svg>
          {t.activity.statement}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t.activity.pdf}</span>
      </div>
    </>
  );
}

// ---------- tab bar icons ----------

function TabIcon({ name }: { name: (typeof SLIDES)[number] }) {
  const paths: Record<string, React.ReactNode> = {
    home: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1Z" />,
    payments: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </>
    ),
    portfolio: (
      <>
        <path d="M12 3a9 9 0 1 0 9 9h-9Z" />
        <path d="M15 3.5A9 9 0 0 1 20.5 9H15Z" />
      </>
    ),
    buy: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    activity: <path d="M4 12h4l2.5-6 3 12 2.5-6H20" />,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
