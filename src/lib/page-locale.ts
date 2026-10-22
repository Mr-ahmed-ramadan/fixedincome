import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "./locale";

/** Resolve the [locale] route param, 404ing on anything but ar/en. */
export async function pageLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, t: getDictionary(locale) };
}

/** The same page in the other language. */
export function otherLocalePath(locale: string, rest = "") {
  return `/${locale === "ar" ? "en" : "ar"}${rest}`;
}
