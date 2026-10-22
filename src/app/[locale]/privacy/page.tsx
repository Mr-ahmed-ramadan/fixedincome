import Link from "next/link";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { Shell } from "@/components/shell";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageLocale(params);
  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, "/privacy")} wide>
      <h1 className="text-3xl font-bold sm:text-4xl">{t.legal.privacyTitle}</h1>
      {t.legal.privacy.map((p) => (
        <p key={p} className="leading-relaxed text-ink/85">{p}</p>
      ))}
      <Link href={`/${locale}`} className="text-primary hover:underline">{t.legal.back}</Link>
    </Shell>
  );
}
