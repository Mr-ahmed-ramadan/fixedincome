import type { Dictionary } from "@/i18n/dictionaries";

export function SectionHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="grid max-w-3xl gap-3" data-reveal>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="text-3xl font-bold tracking-tight sm:text-5xl rtl:tracking-normal">{title}</h2>
      {sub && <p className="text-lg leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

/** The three "how it will work" steps, shown beside the waitlist form. */
export function HowSteps({ t }: { t: Dictionary }) {
  return (
    <div className="grid gap-4" data-reveal data-reveal-delay="1">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted rtl:tracking-normal">{t.how.eyebrow}</h3>
      <ol className="grid gap-5">
        {t.how.steps.map((s, i) => (
          <li key={s.t} className="flex gap-4">
            <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-onprimary">{i + 1}</span>
            <span className="grid gap-1">
              <span className="font-semibold">{s.t}</span>
              <span className="text-sm leading-relaxed text-muted">{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Faq({ t }: { t: Dictionary }) {
  return (
    <section id="faq" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-3xl gap-8 px-4 sm:px-6">
        <SectionHead title={t.faq.title} />
        <div className="divide-y divide-line rounded-3xl bg-card px-5 ring-1 ring-line/60 sm:px-7">
          {t.faq.items.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="text-2xl font-light text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pt-3 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
