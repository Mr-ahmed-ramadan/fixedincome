import Link from "next/link";
import { redirect } from "next/navigation";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { readVerifyToken } from "@/lib/tokens";
import { confirmEmail } from "@/lib/waitlist";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const { locale, t } = await pageLocale(params);
  const { token } = await searchParams;
  const userId = readVerifyToken(token);
  const user = userId ? await confirmEmail(userId) : null;
  if (user) redirect(`/${locale}/welcome/${user.referralCode}`);

  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, "/verify")}>
      <h1 className="text-3xl font-bold">{t.verify.badTitle}</h1>
      <p className="text-muted">{t.verify.badBody}</p>
      <Link href={`/${locale}#join`} className="btn-primary w-fit">{t.verify.badCta}</Link>
    </Shell>
  );
}
