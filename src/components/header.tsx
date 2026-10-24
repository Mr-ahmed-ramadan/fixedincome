import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";
import { Wordmark } from "./logo";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function Header({ t, locale, switchHref }: { t: Dictionary; locale: Locale; switchHref: string }) {
  const links = (
    [
      ["#yields", t.nav.yields],
      ["#compare", t.nav.compare],
      ["#partners", t.nav.partners],
      ["#faq", t.nav.faq],
    ] as const
  ).map(([hash, label]) => [`/${locale}${hash}`, label] as const);
  const other = locale === "ar" ? "en" : "ar";
  return (
    <header className="glass sticky top-0 z-40 border-b border-line/70">
      <div className="relative mx-auto flex h-14 max-w-site items-center gap-6 px-4 sm:px-6">
        <Link href={`/${locale}`} aria-label={t.brand}>
          <Wordmark name={t.brand} animated />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm text-ink/80 md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5 md:ms-0 md:gap-2">
          <ThemeToggle labels={t.nav.theme} />
          <a
            href={`/${locale}/account`}
            aria-label={t.nav.account}
            title={t.nav.account}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/80 ring-1 ring-line transition hover:bg-ink/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
            </svg>
          </a>
          <a
            href={switchHref}
            hrefLang={other}
            aria-label={t.nav.switchLabel}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink/80 ring-1 ring-line transition-colors hover:bg-ink/5 hover:text-ink"
          >
            {t.nav.switchTo}
          </a>
          <a href={`/${locale}#join`} className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-onprimary">
            {t.nav.join}
          </a>
          <MobileNav
            links={[...links, [`/${locale}/account`, t.nav.account] as const]}
            join={{ href: `/${locale}#join`, label: t.hero.cta }}
            switchLang={{ href: switchHref, label: t.nav.switchTo, hrefLang: other }}
            labels={{ menu: t.nav.menu, close: t.nav.close }}
          />
        </div>
      </div>
    </header>
  );
}
