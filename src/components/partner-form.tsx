"use client";

import { useActionState } from "react";
import { partnerAction, type FormState } from "@/app/[locale]/actions";
import type { Locale } from "@/lib/locale";

export type PartnerLabels = {
  institution: string;
  type: string;
  types: Record<string, string>;
  name: string;
  role: string;
  email: string;
  phone: string;
  message: string;
  submit: string;
  submitting: string;
  sentTitle: string;
  sentBody: string;
  pickTime: string;
  errors: Record<string, string>;
};

const initial: FormState = { status: "idle" };

export function PartnerForm({ locale, t, calUrl }: { locale: Locale; t: PartnerLabels; calUrl: string }) {
  const [state, action, pending] = useActionState(partnerAction, initial);

  if (state.status === "sent") {
    return (
      <div className="grid justify-items-start gap-3 py-6" role="status">
        <h3 className="text-2xl font-bold">{t.sentTitle}</h3>
        <p className="text-muted">{t.sentBody}</p>
        {calUrl && (
          <a href={calUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2">
            {t.pickTime}
          </a>
        )}
      </div>
    );
  }

  const err = state.status === "error" ? state.field : undefined;
  const field = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="grid gap-1.5">
      <label htmlFor={`p-${id}`} className="text-sm font-medium text-ink/80">{label}</label>
      <input id={`p-${id}`} name={id} defaultValue={state.values?.[id]} className="field" aria-invalid={err === id || undefined} {...props} />
    </div>
  );

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        {field("institution", t.institution, { required: true, autoComplete: "organization" })}
        <div className="grid gap-1.5">
          <label htmlFor="p-type" className="text-sm font-medium text-ink/80">{t.type}</label>
          <select id="p-type" name="type" className="field" defaultValue={state.values?.type || "BROKER"}>
            {Object.entries(t.types).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", t.name, { required: true, autoComplete: "name" })}
        {field("role", t.role, { autoComplete: "organization-title" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("email", t.email, { required: true, type: "email", inputMode: "email", autoComplete: "email", dir: "ltr" })}
        {field("phone", t.phone, { type: "tel", inputMode: "tel", autoComplete: "tel", dir: "ltr" })}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="p-message" className="text-sm font-medium text-ink/80">{t.message}</label>
        <textarea id="p-message" name="message" defaultValue={state.values?.message} rows={3} className="field resize-y" />
      </div>
      {err && (
        <p role="alert" className="text-sm font-medium text-accent">
          {t.errors[err] ?? t.errors.generic}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-fit">
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
