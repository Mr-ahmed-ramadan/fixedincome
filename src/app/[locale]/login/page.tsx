import Link from "next/link";
import { redirect } from "next/navigation";
import { currentMember } from "@/lib/member";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { LoginForm } from "@/components/login-form";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageLocale(params);
  if (await currentMember()) redirect(`/${locale}/account`);

  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, "/login")}>
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">{t.login.title}</h1>
        <p className="text-muted">{t.login.sub}</p>
      </div>
      <LoginForm locale={locale} t={t.login} errors={t.join.errors} />
      <p className="text-sm text-muted">
        {t.login.notMember}{" "}
        <Link href={`/${locale}#join`} className="font-semibold text-primary underline">{t.login.join}</Link>
      </p>
    </Shell>
  );
}
