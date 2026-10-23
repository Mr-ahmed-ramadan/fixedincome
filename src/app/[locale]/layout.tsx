import { THEME_SCRIPT } from "@/components/theme-toggle";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, LOCALES } from "@/lib/locale";
import { APP_URL } from "@/lib/site";
import { RevealRoot } from "@/components/reveal";
import "../globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F5FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F1D" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(APP_URL),
    title: t.meta.title,
    description: t.meta.description,
    applicationName: "AGYAL",
    openGraph: {
      type: "website",
      siteName: "AGYAL",
      title: t.meta.ogTitle,
      description: t.meta.ogSub,
      url: `/${locale}`,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      images: [{ url: `/og/og-${locale}.png`, width: 1200, height: 630, alt: t.meta.ogTitle }],
    },
    twitter: { card: "summary_large_image", title: t.meta.ogTitle, description: t.meta.ogSub, images: [`/og/og-${locale}.png`] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <html lang={locale} dir={t.dir} className={plexArabic.variable} suppressHydrationWarning>
      <body>
        {/* Before anything paints: apply the saved light/dark choice. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} suppressHydrationWarning />
        {children}
        <RevealRoot />
      </body>
    </html>
  );
}
