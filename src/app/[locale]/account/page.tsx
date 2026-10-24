import { redirect } from "next/navigation";
import { logoutAction } from "../actions";
import { currentMember } from "@/lib/member";
import { pageLocale, otherLocalePath } from "@/lib/page-locale";
import { currentProgress } from "@/lib/progress";
import { LadderMark } from "@/components/logo";
import { Shell } from "@/components/shell";
import { Timeline } from "@/components/timeline";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

/** The member's home. Before launch it shows our progress; at launch this is where onboarding goes. */
export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await pageLocale(params);
  const member = await currentMember();
  if (!member) redirect(`/${locale}/login`);
  const progress = await currentProgress();
  const note = progress.note[locale];

  return (
    <Shell t={t} locale={locale} switchHref={otherLocalePath(locale, "/account")}>
      <LadderMark className="h-12 w-12" animated />
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">{t.account.title(member.name.split(" ")[0])}</h1>
        <p className="text-muted">{t.account.sub}</p>
      </div>
      <p className="rounded-2xl bg-primary/5 px-4 py-3 text-sm font-medium text-ink/80">{t.account.confirmed}</p>

      <section className="grid gap-4" data-section="progress">
        {note && (
          <div className="grid gap-1 rounded-3xl bg-accent/10 p-5">
            <h2 className="text-sm font-bold text-accent">{t.account.update}</h2>
            <p className="whitespace-pre-line text-ink/90">{note}</p>
          </div>
        )}
        <Timeline t={t.timeline} current={progress.step} />
      </section>

      <form action={logoutAction} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm">
        <input type="hidden" name="locale" value={locale} />
        <span className="text-muted">
          {t.account.loggedInAs}{" "}
          <bdi dir="ltr" className="break-all">{member.email}</bdi>
        </span>
        <button type="submit" className="font-semibold text-primary underline">{t.account.logout}</button>
      </form>
    </Shell>
  );
}
