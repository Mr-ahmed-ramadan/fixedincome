import { prisma } from "@/lib/db";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { CAL_URL, googleEnabled } from "@/lib/site";
import { formatAsOf, groupByCurrency, type Quote } from "@/lib/yields";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { PartnerForm } from "@/components/partner-form";
import { Faq, HowItWorks, Products, SectionHead } from "@/components/sections";
import { WaitlistForm } from "@/components/waitlist-form";
import { YieldsBoard } from "@/components/yields-board";

// Re-render at most every 5 minutes; saving yields in /admin refreshes immediately.
export const revalidate = 300;

async function loadQuotes(): Promise<Quote[]> {
  try {
    return await prisma.yieldQuote.findMany({ where: { active: true }, orderBy: [{ currency: "asc" }, { sortOrder: "asc" }] });
  } catch (e) {
    console.error("Could not load yields", e);
    return [];
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageLocale(params);
  const groups = groupByCurrency(await loadQuotes()).map((g) => ({
    currency: g.currency,
    quotes: g.quotes.map((q) => ({ ...q, asOf: new Date(q.asOf).toISOString(), asOfLabel: formatAsOf(q.asOf, locale) })),
  }));

  return (
    <>
      <Header t={t} locale={locale} switchHref={otherLocalePath(locale)} />
      <main>
        <Hero t={t} locale={locale} quotes={groups[0]?.quotes ?? []} />

        <section id="yields" className="scroll-mt-16 py-20 sm:py-28">
          <div className="mx-auto grid max-w-site gap-10 px-4 sm:px-6">
            <SectionHead eyebrow={t.yields.eyebrow} title={t.yields.title} sub={t.yields.sub} />
            <div data-reveal data-reveal-delay="1">
              <YieldsBoard
                locale={locale}
                groups={groups}
                labels={{
                  currencies: t.yields.currencies,
                  atMaturity: t.yields.atMaturity,
                  couponLabels: Object.fromEntries([1, 2, 4, 12].map((n) => [n, t.yields.coupons(n)])),
                  asOf: t.yields.asOf,
                  empty: t.yields.empty,
                }}
              />
            </div>
            <p className="max-w-3xl text-sm text-muted">{t.yields.note}</p>
          </div>
        </section>

        <Products t={t} />
        <HowItWorks t={t} />

        <section id="join" className="scroll-mt-16 py-20 sm:py-28">
          <div className="mx-auto grid max-w-site items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
            <SectionHead eyebrow={t.join.eyebrow} title={t.join.title} sub={t.join.sub} />
            <div className="rounded-4xl bg-card p-6 shadow-[0_30px_60px_-30px_rgba(15,22,48,.25)] ring-1 ring-line/60 sm:p-8" data-reveal data-reveal-delay="1">
              <WaitlistForm
                locale={locale}
                google={googleEnabled()}
                t={{ ...t.join, sentBody: t.join.sentBody("{email}") }}
              />
            </div>
          </div>
        </section>

        <section id="partners" className="scroll-mt-16 bg-ink py-20 text-paper sm:py-28 [&_.text-muted]:text-paper/70">
          <div className="mx-auto grid max-w-site gap-12 px-4 sm:px-6 md:grid-cols-[1fr_1.2fr]">
            <SectionHead eyebrow={t.partners.eyebrow} title={t.partners.title} sub={t.partners.sub} />
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
