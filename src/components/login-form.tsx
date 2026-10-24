"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction, type LoginState } from "@/app/[locale]/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";

const initial: LoginState = { step: "email" };
const RESEND_SECONDS = 60;

/** Two steps on one form: email → 6-digit code. The action redirects to /account on success. */
// Wording is passed as plain strings ({email}, {s} placeholders): functions can't cross to the browser.
export function LoginForm({ locale, t, errors }: { locale: Locale; t: Dictionary["login"]; errors: Dictionary["join"]["errors"] }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [restart, setRestart] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    setRestart(false);
    if (!state.sentAt) return;
    const tick = () => setLeft(Math.max(0, RESEND_SECONDS - Math.floor((Date.now() - state.sentAt!) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.sentAt, state]);

  const step = restart ? "email" : state.step;
  const error = restart ? undefined : state.error;
  const message =
    error === "email" ? t.errors.email
    : error === "code" ? t.errors.code
    : error === "locked" ? t.errors.locked
    : error === "busy" ? t.errors.busy
    : error === "rate" ? errors.rate
    : error === "generic" ? errors.generic
    : null;

  if (step === "email") {
    return (
      <form action={action} className="grid gap-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="intent" value="send" />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <div className="grid gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-ink/80">{t.email}</label>
          <input id="login-email" name="email" type="email" inputMode="email" autoComplete="email" required dir="ltr" defaultValue={state.email} aria-invalid={error === "email"} className="field" />
        </div>
        {message && <p role="alert" className="text-sm font-medium text-accent">{message}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">{t.send}</button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="rounded-2xl bg-primary/5 px-4 py-3 text-sm text-ink/80">{t.sent.replace("{email}", state.email ?? "")}</p>
      <form action={action} className="grid gap-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="intent" value="verify" />
        <input type="hidden" name="email" value={state.email} />
        <div className="grid gap-1.5">
          <label htmlFor="login-code" className="text-sm font-medium text-ink/80">{t.code}</label>
          <input
            id="login-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            dir="ltr"
            autoFocus
            aria-invalid={error === "code" || error === "locked"}
            className="field text-center text-2xl font-semibold tracking-[0.4em]"
          />
        </div>
        {message && <p role="alert" className="text-sm font-medium text-accent">{message}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">{t.verify}</button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <form action={action}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="intent" value="send" />
          <input type="hidden" name="email" value={state.email} />
          <button type="submit" disabled={pending || left > 0} className="font-semibold text-primary underline disabled:text-muted disabled:no-underline">
            {left > 0 ? t.resendIn.replace("{s}", String(left)) : t.resend}
          </button>
        </form>
        <button type="button" onClick={() => setRestart(true)} className="text-muted underline">{t.otherEmail}</button>
      </div>
    </div>
  );
}
