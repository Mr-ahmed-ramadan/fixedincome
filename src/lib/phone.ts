/** Country calling codes offered in the forms, Egypt first, then the Gulf and Arab world. */
export const COUNTRY_CODES = [
  { iso: "EG", dial: "20", en: "Egypt", ar: "مصر" },
  { iso: "SA", dial: "966", en: "Saudi Arabia", ar: "السعودية" },
  { iso: "AE", dial: "971", en: "UAE", ar: "الإمارات" },
  { iso: "KW", dial: "965", en: "Kuwait", ar: "الكويت" },
  { iso: "QA", dial: "974", en: "Qatar", ar: "قطر" },
  { iso: "BH", dial: "973", en: "Bahrain", ar: "البحرين" },
  { iso: "OM", dial: "968", en: "Oman", ar: "عُمان" },
  { iso: "JO", dial: "962", en: "Jordan", ar: "الأردن" },
  { iso: "LB", dial: "961", en: "Lebanon", ar: "لبنان" },
  { iso: "MA", dial: "212", en: "Morocco", ar: "المغرب" },
  { iso: "GB", dial: "44", en: "United Kingdom", ar: "المملكة المتحدة" },
  { iso: "US", dial: "1", en: "USA / Canada", ar: "أمريكا / كندا" },
  { iso: "DE", dial: "49", en: "Germany", ar: "ألمانيا" },
  { iso: "FR", dial: "33", en: "France", ar: "فرنسا" },
] as const;

const DIALS = new Set<string>(COUNTRY_CODES.map((c) => c.dial));
const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

function toWesternDigits(s: string): string {
  return s.replace(ARABIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/**
 * Turn a dial code plus a locally typed number into E.164 (+201001234567).
 * Accepts Arabic-Indic digits, spaces, dashes, and the local trunk 0
 * (Egyptians type 010…, which becomes +2010…). Returns null if implausible.
 */
export function normalizePhone(dial: string, local: string): string | null {
  if (!DIALS.has(dial)) return null;
  let digits = toWesternDigits(local).replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
    if (!digits.startsWith(dial)) return /^\d{8,15}$/.test(digits) ? `+${digits}` : null;
    digits = digits.slice(dial.length);
  } else if (digits.startsWith("00" + dial)) {
    digits = digits.slice(2 + dial.length);
  }
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0")) digits = digits.slice(1);

  // Egyptian mobiles: 10, 11, 12, 15 followed by 8 digits.
  if (dial === "20" && !/^1[0125]\d{8}$/.test(digits)) return null;

  const full = dial + digits;
  if (full.length < 8 || full.length > 15) return null;
  return `+${full}`;
}
