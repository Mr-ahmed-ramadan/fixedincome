import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";
import { Footer } from "./footer";
import { Header } from "./header";

/** Header + a centred card + footer, for the small flow pages. */
export function Shell({ t, locale, switchHref, children, wide }: { t: Dictionary; locale: Locale; switchHref: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <Header t={t} locale={locale} switchHref={switchHref} />
      <main className="px-4 py-16 sm:py-24">
        <div className={`mx-auto grid gap-6 rounded-4xl bg-card p-6 ring-1 ring-line/60 sm:p-10 ${wide ? "max-w-3xl" : "max-w-lg"}`}>{children}</div>
      </main>
      <Footer t={t} locale={locale} />
    </>
  );
}
