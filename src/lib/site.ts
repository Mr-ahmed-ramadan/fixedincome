// The public address used in emails, invite links and link previews. Set APP_URL
// (e.g. https://agyal.net); on Vercel it falls back to the project's production URL.
const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const APP_URL = (
  process.env.APP_URL || (vercelProduction ? `https://${vercelProduction}` : "http://localhost:3000")
).replace(/\/$/, "");
export const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL || "";
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@agyal.net";
export const googleEnabled = () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export function inviteUrl(locale: string, code: string): string {
  return `${APP_URL}/${locale}?ref=${code}`;
}
