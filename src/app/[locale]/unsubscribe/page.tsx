import Link from "next/link";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { readUnsubscribeToken } from "@/lib/tokens";
import { unsubscribeMember } from "@/lib/waitlist";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function UnsubscribePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const { locale, t } = await pageLocale(params);
  const { token } = await searchParams;
  const userId = readUnsubscribeToken(token);
  const ok = userId ? await unsubscribeMember(userId) : false;
  const u = t.unsubscribe;
  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, `/unsubscribe${token ? `?token=${encodeURIComponent(token)}` : ""}`)}>
      <h1 className="text-3xl font-bold">{ok ? u.okTitle : u.badTitle}</h1>
      <p className="text-muted">{ok ? u.okBody : u.badBody}</p>
      <Link href={`/${locale}`} className="btn-primary w-fit">{u.back}</Link>
    </Shell>
  );
}
