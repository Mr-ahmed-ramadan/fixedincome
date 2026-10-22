import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";
import { Wordmark } from "./logo";

export function Header({ t, locale, switchHref }: { t: Dictionary; locale: Locale; switchHref: string }) {
  const links = [
    ["#yields", t.nav.yields],
    ["#compare", t.nav.compare],
    ["#products", t.nav.products],
    ["#partners", t.nav.partners],
  ] as const;
  return (
    <header className="glass sticky top-0 z-40 border-b border-line/70">
      <div className="mx-auto flex h-14 max-w-site items-center gap-6 px-4 sm:px-6">
        <Link href={`/${locale}`} aria-label={t.brand}>
          <Wordmark name={t.brand} />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm text-ink/80 md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={`/${locale}${href}`} className="transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <Link
            href={switchHref}
            hrefLang={locale === "ar" ? "en" : "ar"}
            aria-label={t.nav.switchLabel}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            {t.nav.switchTo}
          </Link>
          <a href={`/${locale}#join`} className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-onprimary">
            {t.nav.join}
          </a>
        </div>
      </div>
    </header>
  );
}
