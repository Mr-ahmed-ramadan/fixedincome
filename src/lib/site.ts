export const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL || "";
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@agyal.net";
export const googleEnabled = () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export function inviteUrl(locale: string, code: string): string {
  return `${APP_URL}/${locale}?ref=${code}`;
}
