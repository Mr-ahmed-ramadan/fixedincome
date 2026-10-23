import { COUNTRY_CODES } from "@/lib/phone";
import type { Locale } from "@/lib/locale";

/** Country code picker + local number, laid out left-to-right in both languages. */
export function PhoneField({ locale, label, countryLabel, invalid, values, idPrefix = "" }: { locale: Locale; label: string; countryLabel: string; invalid?: boolean; values?: Record<string, string>; idPrefix?: string }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={`${idPrefix}phone`} className="text-sm font-medium text-ink/80">{label}</label>
      <div className="flex min-w-0 gap-2" dir="ltr">
        <select id={`${idPrefix}dial`} name="dial" aria-label={countryLabel} defaultValue={values?.dial || "20"} className="field w-auto shrink-0 pe-8">
          {COUNTRY_CODES.map((c) => (
            <option key={c.iso} value={c.dial} title={locale === "ar" ? c.ar : c.en}>
              {c.iso} +{c.dial}
            </option>
          ))}
        </select>
        <input
          id={`${idPrefix}phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          defaultValue={values?.phone}
          placeholder="10 1234 5678"
          aria-invalid={invalid || undefined}
          size={1}
          className="field min-w-0 flex-1"
        />
      </div>
    </div>
  );
}
