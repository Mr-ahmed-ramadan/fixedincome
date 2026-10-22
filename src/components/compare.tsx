import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/locale";
import { afterTax, type Quote } from "@/lib/yields";
import { SectionHead } from "./sections";

/**
 * T-bills next to bank CDs and money market funds. Each bar is drawn to one
 * scale: the pale part is the headline yield, the solid part what's left after
 * withholding tax.
 */
export function Compare({ t, locale, rows }: { t: Dictionary; locale: Locale; rows: Quote[] }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.yieldPct));
  const c = t.compare;

  return (
    <section id="compare" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-site gap-10 px-4 sm:px-6">
        <SectionHead eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
        <div className="grid gap-3" data-reveal data-reveal-delay="1">
          {rows.map((r) => {
            const keep = afterTax(r);
            const facts = c.facts[r.instrument] ?? c.facts.TBILL;
            const highlight = r.instrument !== "CD" && r.instrument !== "MMF";
            return (
              <article
                key={r.id}
                className={`grid gap-4 rounded-3xl bg-card p-5 sm:grid-cols-[14rem_1fr_15rem] sm:items-center sm:p-6 ${highlight ? "ring-2 ring-primary/40" : "ring-1 ring-line/60"}`}
              >
                <div className="grid gap-1">
                  <h3 className="text-lg font-semibold">{locale === "ar" ? r.labelAr : r.labelEn}</h3>
                  <p className="text-sm text-muted">{facts.paid}</p>
                  <p className="text-sm text-muted">{facts.rate}</p>
                </div>

                <div className="grid gap-1.5" aria-hidden>
                  <div className="relative h-4 overflow-hidden rounded-full bg-ink/5" style={{ direction: "ltr" }}>
                    <span className="absolute inset-y-0 left-0 rounded-full bg-primary/25" style={{ width: `${(r.yieldPct / max) * 100}%` }} />
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full ${highlight ? "bg-primary" : "bg-muted/70"}`}
                      style={{ width: `${((keep ?? r.yieldPct) / max) * 100}%` }}
                    />
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-6">
                  <div className="grid">
                    <dt className="text-xs text-muted">{c.yieldLabel}</dt>
                    <dd className="num text-2xl font-bold">{r.yieldPct.toFixed(2)}%</dd>
                  </div>
                  <div className="grid">
                    <dt className="text-xs text-muted">{c.keepLabel}</dt>
                    <dd className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>
                      {keep == null ? <span className="text-base font-medium text-muted">{c.taxVaries}</span> : <span className="num">{keep.toFixed(2)}%</span>}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
        <p className="max-w-3xl text-sm text-muted">{c.note}</p>
      </div>
    </section>
  );
}

export function VsFunds({ t }: { t: Dictionary }) {
  const v = t.vsFunds;
  return (
    <section id="vs-funds" className="scroll-mt-16 bg-card py-20 sm:py-28">
      <div className="mx-auto grid max-w-site gap-12 px-4 sm:px-6">
        <SectionHead eyebrow={v.eyebrow} title={v.title} sub={v.sub} />
        <div className="grid gap-8 md:grid-cols-3">
          {v.points.map((p, i) => (
            <div key={p.t} className="grid content-start gap-3" data-reveal data-reveal-delay={String(i + 1)}>
              <span className="h-1 w-10 rounded-full bg-accent" />
              <h3 className="text-xl font-semibold">{p.t}</h3>
              <p className="leading-relaxed text-muted">{p.d}</p>
            </div>
          ))}
        </div>

        {/* Phones: one card per question. Wider screens: a side-by-side table. */}
        <div className="grid gap-3 sm:hidden" data-reveal>
          {v.table.rows.map(([label, bond, fund]) => (
            <div key={label} className="grid gap-2 rounded-2xl bg-paper p-4">
              <div className="text-sm font-semibold">{label}</div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="font-medium text-primary">{v.table.bond}</span>
                <span className="font-medium">{bond}</span>
                <span className="text-muted">{v.table.fund}</span>
                <span className="text-muted">{fund}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-3xl ring-1 ring-line sm:block" data-reveal>
          <table className="w-full text-start text-base">
            <thead>
              <tr className="bg-paper">
                <th className="w-1/4 p-4 text-start font-medium text-muted" />
                <th className="p-4 text-start font-semibold text-primary">{v.table.bond}</th>
                <th className="p-4 text-start font-semibold">{v.table.fund}</th>
              </tr>
            </thead>
            <tbody>
              {v.table.rows.map(([label, bond, fund]) => (
                <tr key={label} className="border-t border-line">
                  <th scope="row" className="p-4 text-start font-medium text-muted">{label}</th>
                  <td className="p-4 font-medium">{bond}</td>
                  <td className="p-4 text-muted">{fund}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-3xl text-sm text-muted">{v.caveat}</p>
      </div>
    </section>
  );
}
