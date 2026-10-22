import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { CompleteForm } from "@/components/complete-form";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function CompletePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageLocale(params);
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect(`/${locale}#join`);

  const user = await prisma.waitlistUser.findUnique({ where: { email } });
  if (!user) redirect(`/${locale}#join`);
  if (user.phone && user.welcomeSentAt) redirect(`/${locale}/welcome/${user.referralCode}`);

  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, "/join/complete")}>
      <h1 className="text-3xl font-bold">{t.complete.title}</h1>
      <p className="text-muted">{t.complete.sub}</p>
      <CompleteForm
        locale={locale}
        t={{ phone: t.join.phone, country: t.join.country, submit: t.complete.submit, error: t.join.errors.phone, generic: t.join.errors.generic, note: t.join.note, notePlaceholder: t.join.notePlaceholder }}
      />
    </Shell>
  );
}
