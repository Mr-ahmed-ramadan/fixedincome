import { NextResponse, type NextRequest } from "next/server";
import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, mergeAttribution, parseAttribution } from "@/lib/attribution";
import { detectLocale, isLocale, LOCALE_COOKIE } from "@/lib/locale";

const YEAR = 60 * 60 * 24 * 365;

/**
 * 1. Send visitors without /ar or /en in the URL to their language
 *    (saved choice → browser language → Arabic).
 * 2. Remember invite codes (?ref=) and campaign tags (?utm_*) for 30 days so a
 *    sign-up is credited even if it happens on a later visit.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const first = pathname.split("/")[1];

  let res: NextResponse;
  if (isLocale(first)) {
    res = NextResponse.next();
    if (req.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: YEAR, sameSite: "lax" });
    }
  } else {
    const locale = detectLocale(req.headers.get("accept-language"), req.cookies.get(LOCALE_COOKIE)?.value);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    res = NextResponse.redirect(url);
  }

  const merged = mergeAttribution(parseAttribution(req.cookies.get(ATTRIBUTION_COOKIE)?.value), searchParams);
  if (merged) {
    res.cookies.set(ATTRIBUTION_COOKIE, JSON.stringify(merged), {
      path: "/",
      maxAge: ATTRIBUTION_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return res;
}

export const config = {
  // Everything except API routes, the admin area, Next internals and files with an extension.
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
