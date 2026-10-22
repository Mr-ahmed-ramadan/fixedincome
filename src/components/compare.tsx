import type { Dictionary } from "@/i18n/dictionaries";
import { BankCompare, type BankPair } from "./bank-compare";
import { SectionHead } from "./sections";

/** Government yields next to the bank equivalent for the same maturity. */
export function Compare({ t, pairs }: { t: Dictionary; pairs: BankPair[] }) {
  if (pairs.length === 0) return null;
  const c = t.compare;
  return (
    <section id="compare" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-site gap-10 px-4 sm:px-6">
        <SectionHead eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
        <div data-reveal data-reveal-delay="1">
          <BankCompare pairs={pairs} labels={{ before: c.before, after: c.after, gov: c.gov, bank: c.bank, asOf: c.asOf }} />
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
