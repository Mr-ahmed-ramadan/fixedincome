import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";
import { Wordmark } from "./logo";

export function Footer({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <footer className="border-t border-line bg-card/50">
      <div className="mx-auto grid max-w-site gap-6 px-4 py-12 text-sm text-muted sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Wordmark name={t.brand} />
          <nav className="flex flex-wrap gap-5">
            <Link href={`/${locale}/privacy`} className="hover:text-ink">{t.footer.privacy}</Link>
            <Link href={`/${locale}/terms`} className="hover:text-ink">{t.footer.terms}</Link>
            <a href={`/${locale}#partners`} className="hover:text-ink">{t.footer.contact}</a>
          </nav>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed">{t.footer.disclaimer}</p>
        <p className="text-xs">© {new Date().getFullYear()} AGYAL · أجيال. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
