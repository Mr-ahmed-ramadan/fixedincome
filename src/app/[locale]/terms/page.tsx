import Link from "next/link";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { Shell } from "@/components/shell";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageLocale(params);
  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, "/terms")} wide>
      <h1 className="text-3xl font-bold sm:text-4xl">{t.legal.termsTitle}</h1>
      {t.legal.terms.map((p) => (
        <p key={p} className="leading-relaxed text-ink/85">{p}</p>
      ))}
      <Link href={`/${locale}`} className="text-primary hover:underline">{t.legal.back}</Link>
    </Shell>
  );
}
