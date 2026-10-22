import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";
import type { Quote } from "@/lib/yields";
import { CountUp } from "./count-up";
import { LadderMark } from "./logo";

export function Hero({ t, locale, quotes }: { t: Dictionary; locale: Locale; quotes: Quote[] }) {
  return (
    <section className="relative overflow-hidden">
      {/* soft lapis and carnelian light behind the phone */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="glow absolute -top-40 end-[-10%] h-[36rem] w-[36rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="glow absolute top-56 end-[18%] h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-site items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pb-24 md:pt-20">
        <div className="grid gap-6">
          <span className="eyebrow" data-reveal>{t.hero.eyebrow}</span>
          <h1
            className="text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl rtl:leading-[1.2] rtl:tracking-normal"
            data-reveal
            data-reveal-delay="1"
          >
            {t.hero.title1}
            <br />
            <span className="text-primary">{t.hero.title2}</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl" data-reveal data-reveal-delay="2">
            {t.hero.sub}
          </p>
          <div className="flex flex-wrap gap-3" data-reveal data-reveal-delay="3">
            <a href={`/${locale}#join`} className="btn-primary">{t.hero.cta}</a>
            <a href={`/${locale}#partners`} className="btn-ghost">{t.hero.cta2}</a>
          </div>
        </div>

        <div className="flex justify-center" data-reveal data-reveal-delay="2">
          <PhoneMock t={t} locale={locale} quotes={quotes} />
        </div>
      </div>
    </section>
  );
}

function PhoneMock({ t, locale, quotes }: { t: Dictionary; locale: Locale; quotes: Quote[] }) {
  const cards = quotes.slice(0, 4);
  const currency = cards[0]?.currency as keyof Dictionary["yields"]["currencies"] | undefined;
  return (
    <div className="float relative w-[17.5rem] sm:w-[19rem]" aria-hidden>
      <div className="rounded-[3rem] bg-[#1b1c1e] p-2.5 shadow-[0_40px_80px_-30px_rgba(15,22,48,.55)] ring-1 ring-white/10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-paper">
          <div className="absolute start-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black rtl:translate-x-1/2" />
          <div className="grid gap-3 px-4 pb-6 pt-12">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <LadderMark className="h-5 w-5" animated />
                {t.brand}
              </span>
              <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] text-muted">{t.nav.switchTo}</span>
            </div>
            <div className="mt-1">
              <div className="text-xs text-muted">{t.hero.phoneTitle}</div>
              <div className="text-lg font-bold">{currency ? t.yields.currencies[currency] : ""}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cards.map((q, i) => (
                <div key={q.id} className={`grid gap-0.5 rounded-2xl bg-card p-3 shadow-sm ${cards.length % 2 && i === cards.length - 1 ? "col-span-2" : ""}`}>
                  <span className="truncate text-[11px] text-muted">{locale === "ar" ? q.labelAr : q.labelEn}</span>
                  <span className="text-2xl font-bold tracking-tight">
                    <CountUp value={q.yieldPct} />
                    <span className="text-sm font-semibold text-muted">%</span>
                  </span>
                  <span className="text-[10px] font-semibold text-primary">
                    {q.couponsPerYear === 0 ? t.yields.atMaturity : t.yields.coupons(q.couponsPerYear)}
                  </span>
                </div>
              ))}
            </div>
            <MiniCurve />
            <div className="rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-onprimary">{t.hero.cta}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A small yield-curve sparkline: short tenors on the left, long on the right. */
function MiniCurve() {
  return (
    <svg viewBox="0 0 240 64" className="h-16 w-full" style={{ direction: "ltr" }}>
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
