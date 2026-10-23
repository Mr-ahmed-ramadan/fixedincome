"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import { WaitlistForm, type JoinLabels } from "./waitlist-form";

export type TradeLabels = {
  buy: string;
  sell: string;
  buyTitle: string; // contains {name}
  sellTitle: string;
  body: string;
  noteBuy: string;
  noteSell: string;
  fullForm: string;
  close: string;
};

export type Side = "buy" | "sell";
export type TradeRequest = { name: string; side: Side; n: number };

type DialogProps = {
  request: TradeRequest | null;
  onClose: () => void;
  labels: TradeLabels;
  locale: Locale;
  join: JoinLabels;
  google: boolean;
};

/**
 * Buying and selling aren't open yet, so Buy/Sell opens this popup: it names
 * the security and offers a quick waitlist sign-up with the interest noted.
 */
export function TradeDialog({ request, onClose, labels, locale, join, google }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (request && !d.open) d.showModal();
    if (!request && d.open) d.close();
  }, [request]);

  const fill = (s: string) => s.replace("{name}", request?.name ?? "");
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="trade-title"
      className="trade-dialog m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-4xl bg-card p-0 text-ink shadow-2xl backdrop:bg-ink/40 sm:m-auto sm:max-w-md sm:rounded-4xl"
    >
      {request && (
        <div className="grid gap-4 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${request.side === "buy" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
                {request.side === "buy" ? labels.buy : labels.sell}
              </span>
              <h2 id="trade-title" className="text-xl font-bold leading-snug">
                {fill(request.side === "buy" ? labels.buyTitle : labels.sellTitle)}
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label={labels.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/70 hover:bg-ink/10">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="leading-relaxed text-muted">{labels.body}</p>
          <WaitlistForm
            key={request.n}
            locale={locale}
            google={google}
            t={join}
            idPrefix="trade-"
            defaultNote={fill(request.side === "buy" ? labels.noteBuy : labels.noteSell)}
          />
          <a href={`/${locale}#join`} onClick={onClose} className="justify-self-center text-sm font-medium text-primary hover:underline">
            {labels.fullForm}
          </a>
        </div>
      )}
    </dialog>
  );
}

export function TradeButtons({ onTrade, labels, className = "" }: { onTrade: (side: Side) => void; labels: TradeLabels; className?: string }) {
  return (
    <span className={`relative z-10 flex gap-1.5 ${className}`}>
      <button type="button" onClick={() => onTrade("buy")} className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-onprimary transition hover:opacity-90">
        {labels.buy}
      </button>
      <button type="button" onClick={() => onTrade("sell")} className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition hover:bg-ink/5">
        {labels.sell}
      </button>
    </span>
  );
}

/** Buy/Sell buttons with their own popup, for a security's page. */
export function SecurityTrade({ name, ...rest }: Omit<DialogProps, "request" | "onClose"> & { name: string }) {
  const [request, setRequest] = useState<TradeRequest | null>(null);
  return (
    <>
      <TradeButtons labels={rest.labels} onTrade={(side) => setRequest((r) => ({ name, side, n: (r?.n ?? 0) + 1 }))} />
      <TradeDialog request={request} onClose={() => setRequest(null)} {...rest} />
    </>
  );
}
