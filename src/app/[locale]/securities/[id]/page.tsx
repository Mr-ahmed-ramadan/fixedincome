import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { formatAsOf } from "@/lib/yields";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SecurityCalculator } from "@/components/security-calculator";

export const revalidate = 300;

const DEFAULT_AMOUNT: Record<string, number> = { EGP: 100_000, USD: 10_000, EUR: 10_000 };

function maturityOf(q: { maturityDate: Date | null; asOf: Date; tenorMonths: number }) {
  if (q.maturityDate) return q.maturityDate;
  const d = new Date(q.asOf);
  d.setUTCMonth(d.getUTCMonth() + q.tenorMonths);
  return d;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, t } = await pageLocale(params);
  const q = await prisma.yieldQuote.findFirst({ where: { id: (await params).id, active: true } }).catch(() => null);
  if (!q) return {};
  return { title: `${locale === "ar" ? q.labelAr : q.labelEn} · ${q.yieldPct.toFixed(2)}% · ${t.brand}` };
}

export default async function SecurityPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, t } = await pageLocale(params);
  const { id } = await params;
  const q = await prisma.yieldQuote.findFirst({ where: { id, active: true } });
  if (!q) notFound();

  const s = t.security;
  const label = locale === "ar" ? q.labelAr : q.labelEn;
  const maturity = maturityOf(q);
  // Settle today, or on the rate's date if it's in the future.
  const settle = new Date(Math.max(Date.now(), q.asOf.getTime()));
  const intl = q.instrument === "EUROBOND";
  const currencyName = t.yields.currencies[q.currency as "EGP" | "USD" | "EUR"] ?? q.currency;
  const defaultAmount = Math.max(q.minInvestment ?? 0, DEFAULT_AMOUNT[q.currency] ?? 10_000);
  const bankLabel = locale === "ar" ? q.bankLabelAr : q.bankLabelEn;

  const facts: [string, React.ReactNode][] = [
    [s.issuer, intl ? s.issuers.intl : s.issuers.local],
    [s.currency, `${q.currency} · ${currencyName}`],
    [s.couponRate, q.couponRatePct != null ? <span className="num">{q.couponRatePct}%</span> : s.none],
    [s.frequency, q.couponsPerYear === 0 ? t.yields.atMaturity : t.yields.coupons(q.couponsPerYear)],
    [s.maturity, formatAsOf(maturity, locale)],
    ...(q.isin ? [[s.isin, <span key="isin" className="num select-all">{q.isin}</span>] as [string, React.ReactNode]] : []),
    ...(q.minInvestment != null ? [[s.minimum, <span key="min" className="num">{q.currency} {q.minInvestment.toLocaleString("en-US")}</span>] as [string, React.ReactNode]] : []),
    [s.yieldAsOf, formatAsOf(q.asOf, locale)],
    ...(q.bankRatePct != null && bankLabel
      ? [[s.bankEq, <span key="bank">{bankLabel} · <span className="num font-semibold">{q.bankRatePct.toFixed(2)}%</span></span>] as [string, React.ReactNode]]
      : []),
  ];

  return (
    <>
      <Header t={t} locale={locale} switchHref={otherLocalePath(locale, `/securities/${q.id}`)} />
      <main className="mx-auto grid max-w-site gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <Link href={`/${locale}#yields`} className="w-fit text-sm font-medium text-primary hover:underline">
          <span aria-hidden className="inline-block rtl:-scale-x-100">←</span> {s.back}
        </Link>

        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{s.types[q.instrument] ?? q.instrument}</span>
            <span className="rounded-full bg-ink/5 px-3 py-1">{q.currency}</span>
            <span className="rounded-full bg-ink/5 px-3 py-1">{s.government}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl rtl:tracking-normal">{label}</h1>
          <p className="text-muted">
            {s.issuer}: {intl ? s.issuers.intl : s.issuers.local}
          </p>
        </div>

        <section className="grid gap-2 rounded-3xl bg-card p-5 ring-1 ring-line/60 sm:p-6">
          <h2 className="text-lg font-semibold">{s.plainTitle}</h2>
          <p className="max-w-3xl leading-relaxed text-ink/85">{s.plain[q.instrument] ?? s.plain.BOND}</p>
        </section>

        <SecurityCalculator
          locale={locale}
          currency={q.currency}
          yieldPct={q.yieldPct}
          couponsPerYear={q.couponsPerYear}
          couponRatePct={q.couponRatePct}
          taxRatePct={q.taxRatePct}
          maturityIso={maturity.toISOString()}
          settleIso={settle.toISOString()}
          minInvestment={q.minInvestment}
          defaultAmount={defaultAmount}
          labels={{
            yieldLabel: s.yieldLabel,
            amount: s.amount,
            minimum: s.minimum,
            term: s.term,
            years: s.years,
            maturity: s.maturity,
            price: s.price,
            face: s.face,
            totalReturn: s.totalReturn,
            getBack: s.getBack,
            afterTax: q.taxRatePct ? s.afterTax(q.taxRatePct) : null,
            estimate: s.estimate,
            scheduleTitle: s.scheduleTitle,
            scheduleFor: s.scheduleFor,
            date: s.date,
            payment: s.payment,
            coupon: s.coupon,
            finalCoupon: s.finalCoupon,
            principal: s.principal,
          }}
        />

        <section className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-line/60 sm:p-6">
          <h2 className="text-lg font-semibold">{s.factsTitle}</h2>
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-t border-line py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="text-end font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="max-w-3xl text-xs text-muted">{s.disclaimer}</p>
      </main>
      <Footer t={t} locale={locale} />
    </>
  );
}
