import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";
import { CountUp } from "./count-up";
import { PhoneScreens, type PhoneQuote } from "./phone-screens";

type Props = {
  t: Dictionary;
  locale: Locale;
  rates: PhoneQuote[]; // first currency on the board, for the phone
  egpBills: PhoneQuote[];
  highlights: PhoneQuote[]; // a few rates shown right in the hero
};

export function Hero({ t, locale, rates, egpBills, highlights }: Props) {
  const couponLabels = Object.fromEntries([1, 2, 4, 12].map((n) => [n, t.yields.coupons(n)]));

  return (
    <section className="relative overflow-hidden">
      {/* soft lapis and carnelian light behind the phone */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="glow absolute -top-40 end-[-10%] h-[36rem] w-[36rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="glow absolute top-56 end-[18%] h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-site items-center gap-10 px-4 pb-14 pt-8 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pb-20 md:pt-14">
        <div className="grid min-w-0 gap-5">
          <span className="eyebrow" data-reveal>{t.hero.eyebrow}</span>
          <h1
            className="text-[2.5rem] font-bold leading-[1.05] tracking-tight sm:text-6xl rtl:leading-[1.25] rtl:tracking-normal"
            data-reveal
            data-reveal-delay="1"
          >
            {t.hero.title1} <span className="text-primary">{t.hero.title2}</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted" data-reveal data-reveal-delay="1">
            {t.hero.sub}
          </p>

          <ul className="flex flex-wrap gap-2" data-reveal data-reveal-delay="2">
            {t.hero.pills.map((p) => (
              <li key={p} className="rounded-full bg-card px-3 py-1 text-sm font-medium ring-1 ring-line">{p}</li>
            ))}
          </ul>

          {highlights.length > 0 && (
            <div className="grid gap-2" data-reveal data-reveal-delay="2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold">{t.hero.ratesTitle}</h2>
                <span className="text-xs text-muted">{t.hero.ratesNote}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {highlights.map((q) => (
                  <a key={q.id} href={`/${locale}/securities/${q.id}`} className="grid gap-0.5 rounded-2xl bg-card p-3 ring-1 ring-line/70 transition hover:ring-primary/40">
                    <span className="flex items-center justify-between gap-1 text-[11px] text-muted">
                      <span className="truncate">{locale === "ar" ? q.labelAr : q.labelEn}</span>
                      <span className="shrink-0 rounded bg-ink/5 px-1 text-[10px] font-semibold">{q.currency}</span>
                    </span>
                    <span className="text-2xl font-bold tracking-tight">
                      <CountUp value={q.yieldPct} />
                      <span className="text-sm font-semibold text-muted">%</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3" data-reveal data-reveal-delay="3">
            <a href={`/${locale}#join`} className="btn-primary">{t.hero.cta}</a>
            <a href={`/${locale}#compare`} className="btn-ghost">{t.hero.ratesMore}</a>
          </div>
          <a href={`/${locale}#partners`} className="w-fit text-sm font-medium text-primary hover:underline">
            {t.hero.partnerLine} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
          </a>
        </div>

        <div className="flex justify-center" data-reveal data-reveal-delay="2">
          <PhoneScreens
            locale={locale}
            brand={t.brand}
            atMaturity={t.yields.atMaturity}
            couponLabels={couponLabels}
            t={t.phone}
            rates={rates}
            egpBills={egpBills}
          />
        </div>
      </div>
    </section>
  );
}
