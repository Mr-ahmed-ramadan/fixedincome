"use client";

import { useActionState } from "react";
import { googleAction, joinAction, type FormState } from "@/app/[locale]/actions";
import type { Locale } from "@/lib/locale";
import { PhoneField } from "./phone-field";

export type JoinLabels = {
  name: string;
  email: string;
  phone: string;
  country: string;
  submit: string;
  submitting: string;
  or: string;
  google: string;
  consent: string;
  sentTitle: string;
  sentBody: string; // contains {email}
  errors: Record<string, string>;
};

const initial: FormState = { status: "idle" };

export function WaitlistForm({ locale, t, google }: { locale: Locale; t: JoinLabels; google: boolean }) {
  const [state, action, pending] = useActionState(joinAction, initial);

  if (state.status === "sent") {
    return (
      <div className="grid justify-items-center gap-3 py-8 text-center" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <h3 className="text-2xl font-bold">{t.sentTitle}</h3>
        <p className="max-w-sm text-muted">{t.sentBody.replace("{email}", state.email ?? "")}</p>
      </div>
    );
  }

  const err = state.status === "error" ? state.field : undefined;
  return (
    <div className="grid gap-5">
      {google && (
        <>
          <form action={googleAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="btn-ghost w-full">
              <GoogleG />
              {t.google}
            </button>
          </form>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" />
            {t.or}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form action={action} className="grid gap-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <div className="grid gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-ink/80">{t.name}</label>
          <input id="name" name="name" defaultValue={state.values?.name} autoComplete="name" required className="field" aria-invalid={err === "name" || undefined} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink/80">{t.email}</label>
          <input id="email" name="email" defaultValue={state.values?.email} type="email" inputMode="email" autoComplete="email" dir="ltr" required className="field rtl:text-right" aria-invalid={err === "email" || undefined} />
        </div>
        <PhoneField locale={locale} label={t.phone} countryLabel={t.country} invalid={err === "phone"} values={state.values} />
        {err && (
          <p role="alert" className="text-sm font-medium text-accent">
            {t.errors[err] ?? t.errors.generic}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary mt-1 w-full">
          {pending ? t.submitting : t.submit}
        </button>
        <p className="text-center text-xs leading-relaxed text-muted">{t.consent}</p>
      </form>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}
