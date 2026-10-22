import type { Dictionary } from "@/i18n/dictionaries";

/** "Where we are": finished steps ticked, the current one highlighted, the rest still ahead. */
export function Timeline({ t }: { t: Dictionary["timeline"] }) {
  return (
    <div className="grid gap-3 rounded-3xl bg-paper p-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-accent rtl:normal-case rtl:tracking-normal">{t.title}</h2>
      <ol className="grid">
        {t.steps.map((step, i) => {
          const done = i < t.current;
          const now = i === t.current;
          const last = i === t.steps.length - 1;
          return (
            <li key={step.t} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && <span aria-hidden className={`absolute start-[11px] top-6 h-[calc(100%-1rem)] w-0.5 ${done ? "bg-primary" : "bg-line"}`} />}
              <span
                aria-hidden
                className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  done ? "bg-primary text-onprimary" : now ? "bg-accent text-white ring-4 ring-accent/20" : "bg-card text-muted ring-1 ring-line"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <div className="grid gap-0.5">
                <span className={`font-semibold ${done || now ? "text-ink" : "text-muted"}`}>
                  {step.t}
                  {now && <span className="ms-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">{t.now}</span>}
                </span>
                <span className="text-sm text-muted">{step.d}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
