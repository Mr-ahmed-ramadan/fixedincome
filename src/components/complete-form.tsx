"use client";

import { useActionState } from "react";
import { completeAction, type FormState } from "@/app/[locale]/actions";
import type { Locale } from "@/lib/locale";
import { PhoneField } from "./phone-field";

const initial: FormState = { status: "idle" };

export function CompleteForm({ locale, t }: { locale: Locale; t: { phone: string; country: string; submit: string; error: string; generic: string; note: string; notePlaceholder: string } }) {
  const [state, action, pending] = useActionState(completeAction, initial);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <PhoneField locale={locale} label={t.phone} countryLabel={t.country} invalid={state.field === "phone"} values={state.values} />
      <div className="grid gap-1.5">
        <label htmlFor="note" className="text-sm font-medium text-ink/80">{t.note}</label>
        <textarea id="note" name="note" rows={2} maxLength={1000} defaultValue={state.values?.note} placeholder={t.notePlaceholder} className="field resize-y" />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-accent">
          {state.field === "phone" ? t.error : t.generic}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">{t.submit}</button>
    </form>
  );
}
