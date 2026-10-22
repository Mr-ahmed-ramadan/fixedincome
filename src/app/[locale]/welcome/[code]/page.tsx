import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { normalizeReferralCode } from "@/lib/referral";
import { inviteUrl } from "@/lib/site";
import { countReferrals } from "@/lib/waitlist";
import { LadderMark } from "@/components/logo";
import { ShareLink } from "@/components/share-link";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function WelcomePage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, t } = await pageLocale(params);
  const code = normalizeReferralCode((await params).code);
  const user = code ? await prisma.waitlistUser.findUnique({ where: { referralCode: code } }) : null;
  if (!user) notFound();

  const friends = await countReferrals(user.id);
  const firstName = user.name.split(" ")[0];

  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, `/welcome/${user.referralCode}`)}>
      <LadderMark className="h-14 w-14" animated />
      <h1 className="text-3xl font-bold sm:text-4xl">{t.welcome.title(firstName)}</h1>
      <p className="text-lg text-muted">{user.emailVerifiedAt ? t.welcome.sub : t.welcome.pending}</p>
      {user.emailVerifiedAt && (
        <div className="grid gap-4 rounded-3xl bg-paper p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{t.welcome.refTitle}</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{t.welcome.count(friends)}</span>
          </div>
          <p className="text-sm text-muted">{t.welcome.refBody}</p>
          <ShareLink url={inviteUrl(locale, user.referralCode)} text={t.welcome.shareText} copyLabel={t.welcome.copy} copiedLabel={t.welcome.copied} />
        </div>
      )}
    </Shell>
  );
}
