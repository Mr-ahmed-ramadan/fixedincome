import { prisma } from "@/lib/db";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { CAL_URL, googleEnabled } from "@/lib/site";
import { maturityOf, tenorBucket, yearsTo } from "@/lib/schedule";
import { formatAsOf, groupByCurrency, type Quote } from "@/lib/yields";
import { Compare, VsFunds } from "@/components/compare";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { PartnerForm } from "@/components/partner-form";
import { Faq, HowSteps, SectionHead } from "@/components/sections";
import { WaitlistForm } from "@/components/waitlist-form";
import { RatesTable, type RateGroup } from "@/components/rates-table";

// Re-render at most every 5 minutes; saving yields in /admin refreshes immediately.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { alternates: { canonical: `/${locale}`, languages: { ar: "/ar", en: "/en", "x-default": "/" } } };
}

/** Tells Google the site's name and logo (shown next to search results). */
const STRUCTURED_DATA = JSON.stringify([
  { "@context": "https://schema.org", "@type": "WebSite", name: "AGYAL", alternateName: "أجيال", url: "https://agyal.net/" },
  { "@context": "https://schema.org", "@type": "Organization", name: "AGYAL", url: "https://agyal.net/", logo: "https://agyal.net/brand/agyal-profile-1024.png" },
]);

async function loadQuotes(): Promise<(Quote & { couponRatePct: number | null; maturityDate: Date | null })[]> {
  try {
    return await prisma.yieldQuote.findMany({ where: { active: true }, orderBy: [{ currency: "asc" }, { sortOrder: "asc" }] });
  } catch (e) {
    console.error("Could not load yields", e);
    // While the site is running, throwing keeps the last good cached page (Next.js
    // doesn't replace it with a failed render), so a database outage never shows an
    // empty rates table. During a build, render without rates rather than fail.
    if (process.env.NEXT_PHASE !== "phase-production-build") throw e;
    return [];
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageLocale(params);
  const all = await loadQuotes();
  const pairs = all
    .filter((q) => q.currency === "EGP" && q.bankRatePct != null)
    .sort((a, b) => a.tenorMonths - b.tenorMonths)
    .map((q) => ({
      id: q.id,
      label: locale === "ar" ? q.labelAr : q.labelEn,
      href: `/${locale}/securities/${q.id}`,
      yieldPct: q.yieldPct,
      taxRatePct: q.taxRatePct ?? null,
      asOf: formatAsOf(q.asOf, locale),
      bankLabel: (locale === "ar" ? q.bankLabelAr : q.bankLabelEn) ?? "",
      bankRatePct: q.bankRatePct!,
      bankAsOf: formatAsOf(q.bankAsOf ?? q.asOf, locale),
    }));
  const groups = groupByCurrency(all).map((g) => ({
    currency: g.currency,
    quotes: g.quotes.map((q) => ({ ...q, asOf: new Date(q.asOf).toISOString(), asOfLabel: formatAsOf(q.asOf, locale) })),
  }));
  const egpBills = groups.find((g) => g.currency === "EGP")?.quotes.filter((q) => q.instrument === "TBILL") ?? [];
  // The rates table: every security per currency, shortest first.
  const now = new Date();
  const rateGroups: RateGroup[] = groupByCurrency(all).map((g) => ({
    currency: g.currency,
    rows: g.quotes
      .map((q) => {
        const maturity = maturityOf(q);
        const years = yearsTo(maturity, now);
        return {
          id: q.id,
          name: locale === "ar" ? q.labelAr : q.labelEn,
          instrument: q.instrument,
          bucket: t.yields.table.buckets[tenorBucket(years)],
          yieldPct: q.yieldPct,
          couponRatePct: q.couponRatePct,
          couponsPerYear: q.couponsPerYear,
          years,
          maturity: formatAsOf(maturity, locale),
          asOf: formatAsOf(q.asOf, locale),
        };
      })
      .sort((a, b) => a.years - b.years),
  }));
  const joinLabels = { ...t.join, sentBody: t.join.sentBody("{email}") };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      <Header t={t} locale={locale} switchHref={otherLocalePath(locale)} />
      <main>
        <Hero
          t={t}
          locale={locale}
          rates={groups[0]?.quotes ?? []}
          egpBills={egpBills}
          table={
            <RatesTable
              locale={locale}
              groups={rateGroups}
              trade={t.trade}
              join={joinLabels}
              google={googleEnabled()}
              labels={{
                ...t.yields.table,
                currencies: t.yields.currencies,
                types: t.yields.filters,
                atMaturity: t.yields.atMaturityShort,
                asOf: t.yields.asOf,
                empty: t.yields.empty,
                soon: t.yields.soon,
                note: t.yields.note,
              }}
            />
          }
        />

        <Compare t={t} pairs={pairs} />
        <VsFunds t={t} />

        <section id="join" className="scroll-mt-16 py-20 sm:py-28">
          <div className="mx-auto grid max-w-site items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
            <div className="grid content-start gap-8">
              <SectionHead eyebrow={t.join.eyebrow} title={t.join.title} sub={t.join.sub} />
              <HowSteps t={t} />
            </div>
            <div className="rounded-4xl bg-card p-6 shadow-[0_30px_60px_-30px_rgba(15,22,48,.25)] ring-1 ring-line/60 sm:p-8" data-reveal data-reveal-delay="1">
              <WaitlistForm
                locale={locale}
                google={googleEnabled()}
                t={joinLabels}
              />
            </div>
          </div>
        </section>

        <section id="partners" className="scroll-mt-16 bg-[#0F1630] py-20 text-white ring-1 ring-white/5 sm:py-28 dark:bg-[#141B33] [&_.text-muted]:text-white/70">
          <div className="mx-auto grid max-w-site gap-12 px-4 sm:px-6 md:grid-cols-[1fr_1.2fr]">
            <div className="grid content-start gap-6">
              <SectionHead eyebrow={t.partners.eyebrow} title={t.partners.title} sub={t.partners.sub} />
              <ul className="grid gap-3" data-reveal data-reveal-delay="1">
                {t.partners.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-white/90">
                    <span aria-hidden className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-white">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-4xl bg-card p-6 text-ink sm:p-8 [&_.text-muted]:!text-muted" data-reveal data-reveal-delay="1">
              <PartnerForm locale={locale} calUrl={CAL_URL} t={t.partners} />
            </div>
          </div>
        </section>

        <Faq t={t} />
      </main>
      <Footer t={t} locale={locale} />
    </>
  );
}
