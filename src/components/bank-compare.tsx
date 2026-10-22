"use client";

import { useState } from "react";
import { afterTax } from "@/lib/yields";

export type BankPair = {
  id: string;
  label: string; // e.g. "12-month T-bill"
  href: string; // the security's own page
  yieldPct: number;
  taxRatePct: number | null;
  asOf: string;
  bankLabel: string; // e.g. "Bank A · 12-month deposit"
  bankRatePct: number; // tax-free for Egyptian residents
  bankAsOf: string;
};

type Labels = { before: string; after: string; gov: string; bank: string; asOf: string };

/**
 * Each government maturity next to its bank equivalent, both bars on one
 * scale. "After tax" removes the withholding tax from the government side;
 * bank interest is tax-free, so its bar doesn't move.
 */
export function BankCompare({ pairs, labels }: { pairs: BankPair[]; labels: Labels }) {
  const [mode, setMode] = useState<"before" | "after">("before");
  const max = Math.max(...pairs.flatMap((p) => [p.yieldPct, p.bankRatePct]));
  const gov = (p: BankPair) => (mode === "after" ? afterTax(p) ?? p.yieldPct : p.yieldPct);

  return (
    <div className="grid gap-5">
      <div role="radiogroup" aria-label={`${labels.before} / ${labels.after}`} className="inline-flex w-fit gap-1 rounded-full bg-ink/5 p-1">
        {(["before", "after"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-2 text-sm transition ${mode === m ? "bg-card font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {labels[m]}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {pairs.map((p) => {
          const g = gov(p);
          return (
            <article key={p.id} className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-line/60 sm:p-6">
              <Bar
                tone="gov"
                tag={labels.gov}
                label={p.label}
                href={p.href}
                value={g}
                width={(g / max) * 100}
                note={`${labels.asOf} ${p.asOf}`}
              />
              <Bar
                tone="bank"
                tag={labels.bank}
                label={p.bankLabel}
                value={p.bankRatePct}
                width={(p.bankRatePct / max) * 100}
                note={`${labels.asOf} ${p.bankAsOf}`}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Bar({ tone, tag, label, href, value, width, note }: { tone: "gov" | "bank"; tag: string; label: string; href?: string; value: number; width: number; note: string }) {
  const gov = tone === "gov";
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${gov ? "bg-primary/10 text-primary" : "bg-ink/5 text-muted"}`}>{tag}</span>
          {href ? (
            <a href={href} className="text-sm font-semibold underline-offset-4 hover:text-primary hover:underline sm:text-base">{label}</a>
          ) : (
            <span className={`text-sm sm:text-base ${gov ? "font-semibold" : "text-muted"}`}>{label}</span>
          )}
        </span>
        <span className={`num text-xl font-bold sm:text-2xl ${gov ? "text-primary" : "text-ink/70"}`}>{value.toFixed(2)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-ink/5" aria-hidden>
        <span
          className={`block h-full rounded-full transition-[width] duration-700 ease-out ${gov ? "bg-primary" : "bg-muted/60"}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-muted">{note}</span>
    </div>
  );
}
