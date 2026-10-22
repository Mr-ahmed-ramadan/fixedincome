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

/** Small line icons for each product, drawn on a 24px grid. */
const ICONS: Record<string, React.ReactNode> = {
  tbills: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  bonds: (
    <>
      <path d="M4 19h16" />
      <path d="M6 16v-4M10 16V9M14 16v-6M18 16V6" />
    </>
  ),
  sukuk: (
    <>
      <path d="M15.5 4.5a7.5 7.5 0 1 0 4 13.8A6 6 0 0 1 15.5 4.5Z" />
      <path d="m17.5 8 .6 1.6 1.7.1-1.3 1.1.4 1.7-1.4-.9-1.4.9.4-1.7-1.3-1.1 1.7-.1Z" />
    </>
  ),
  eurobonds: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.3 3.5 5 3.5 8s-1 5.7-3.5 8c-2.5-2.3-3.5-5-3.5-8s1-5.7 3.5-8Z" />
    </>
  ),
  corporate: (
    <>
      <path d="M5 20V8l7-4 7 4v12" />
      <path d="M9 20v-5h6v5M9 11h.01M15 11h.01" />
    </>
  ),
};

export function Products({ t }: { t: Dictionary }) {
  return (
    <section id="products" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-site gap-12 px-4 sm:px-6">
        <SectionHead eyebrow={t.products.eyebrow} title={t.products.title} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {t.products.items.map((p, i) => (
            <article
              key={p.key}
              className="grid content-start gap-4 rounded-3xl bg-card p-6 ring-1 ring-line/60"
              data-reveal
              data-reveal-delay={String(Math.min(i, 4))}
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICONS[p.key]}
                </svg>
              </span>
              <h3 className="text-lg font-semibold">{p.t}</h3>
              <p className="text-sm leading-relaxed text-muted">{p.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ t }: { t: Dictionary }) {
  return (
    <section id="how" className="scroll-mt-16 bg-card py-20 sm:py-28">
      <div className="mx-auto grid max-w-site gap-12 px-4 sm:px-6">
        <SectionHead eyebrow={t.how.eyebrow} title={t.how.title} />
        <ol className="grid gap-8 md:grid-cols-3">
          {t.how.steps.map((s, i) => (
            <li key={s.t} className="grid content-start gap-3" data-reveal data-reveal-delay={String(i + 1)}>
              <span className="num grid h-10 w-10 place-items-center rounded-full bg-primary text-base font-bold text-onprimary">{i + 1}</span>
              <h3 className="text-xl font-semibold">{s.t}</h3>
              <p className="leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
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
