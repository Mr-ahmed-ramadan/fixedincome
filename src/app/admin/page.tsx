import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { CURRENCIES, INSTRUMENTS } from "@/lib/yields";
import { Wordmark } from "@/components/logo";
import { deleteQuote, login, logout, saveQuote } from "./actions";

export const dynamic = "force-dynamic";

type Search = Promise<{ tab?: string; error?: string; saved?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  if (!(await isAdmin())) return <Login failed={Boolean(sp.error)} configured={Boolean(process.env.ADMIN_PASSWORD)} />;

  const tab = sp.tab ?? "overview";
  const tabs = [
    ["overview", "Overview"],
    ["yields", "Yields"],
    ["waitlist", "Waitlist"],
    ["partners", "Partners"],
    ["brand", "Brand"],
  ] as const;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center gap-4">
        <Wordmark name="AGYAL admin" />
        <nav className="flex flex-wrap gap-1 rounded-full bg-ink/5 p-1 text-sm">
          {tabs.map(([key, label]) => (
            <Link key={key} href={`/admin?tab=${key}`} className={`rounded-full px-4 py-1.5 ${tab === key ? "bg-card font-semibold shadow-sm" : "text-muted"}`}>
              {label}
            </Link>
          ))}
        </nav>
        <span className="ms-auto">
          <ThemeToggle labels={{ auto: "Theme: auto", light: "Theme: light", dark: "Theme: dark" }} />
        </span>
        <form action={logout}>
          <button className="text-sm text-muted hover:text-ink">Sign out</button>
        </form>
      </header>
      {tab === "yields" && <Yields error={sp.error} saved={Boolean(sp.saved)} />}
      {tab === "waitlist" && <Waitlist />}
      {tab === "partners" && <Partners />}
      {tab === "overview" && <Overview />}
      {tab === "brand" && <Brand />}
    </div>
  );
}

function Login({ failed, configured }: { failed: boolean; configured: boolean }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form action={login} className="grid w-full max-w-sm gap-4 rounded-3xl bg-card p-8 ring-1 ring-line">
        <Wordmark name="AGYAL admin" />
        {!configured && <p className="text-sm text-accent">Set ADMIN_PASSWORD in the environment to enable the admin area.</p>}
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        {failed && <p className="text-sm text-accent">That password didn&apos;t match.</p>}
        <button className="btn-primary">Sign in</button>
      </form>
    </main>
  );
}

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="grid gap-1 rounded-3xl bg-card p-5 ring-1 ring-line/60">
      <span className="text-sm text-muted">{label}</span>
      <span className="num text-3xl font-bold">{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

async function Overview() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [total, confirmed, lastWeek, partners, referred, sources] = await Promise.all([
    prisma.waitlistUser.count(),
    prisma.waitlistUser.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.waitlistUser.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.partnerRequest.count(),
    prisma.waitlistUser.count({ where: { referredById: { not: null } } }),
    prisma.waitlistUser.groupBy({ by: ["utmSource"], _count: { _all: true }, orderBy: { _count: { utmSource: "desc" } }, take: 8 }),
  ]);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card label="Waitlist" value={total} />
        <Card label="Confirmed email" value={confirmed} hint={total ? `${Math.round((confirmed / total) * 100)}% of sign-ups` : undefined} />
        <Card label="Joined this week" value={lastWeek} />
        <Card label="Came via a friend" value={referred} />
        <Card label="Partner requests" value={partners} />
      </div>
      <section className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-line/60">
        <h2 className="font-semibold">Where sign-ups come from (utm_source)</h2>
        <table className="text-sm">
          <tbody>
            {sources.map((s) => (
              <tr key={s.utmSource ?? "none"} className="border-t border-line">
                <td className="py-2">{s.utmSource ?? "(direct / untagged)"}</td>
                <td className="num py-2 text-end font-semibold">{s._count._all}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted">
          Tag each post&apos;s link, e.g. agyal.net/ar?utm_source=instagram&amp;utm_campaign=launch, to see which posts bring people in.
        </p>
      </section>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-line bg-paper px-2.5 py-2 text-sm";

async function Yields({ error, saved }: { error?: string; saved: boolean }) {
  const quotes = await prisma.yieldQuote.findMany({ orderBy: [{ currency: "asc" }, { sortOrder: "asc" }] });
  const today = new Date().toISOString().slice(0, 10);
  const row = (q?: (typeof quotes)[number]) => (
    <form key={q?.id ?? "new"} action={saveQuote} className="grid grid-cols-2 items-end gap-2 rounded-2xl bg-card p-4 ring-1 ring-line/60 md:grid-cols-[5rem_6.5rem_1fr_1fr_4.5rem_5rem_4.5rem_4.5rem_4rem_8.5rem_auto]">
      {q && <input type="hidden" name="id" value={q.id} />}
      <Field label="Currency">
        <select name="currency" defaultValue={q?.currency ?? "EGP"} className={inputCls}>
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Type">
        <select name="instrument" defaultValue={q?.instrument ?? "TBILL"} className={inputCls}>
          {INSTRUMENTS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Label (English)"><input name="labelEn" defaultValue={q?.labelEn} required className={inputCls} /></Field>
      <Field label="Label (Arabic)"><input name="labelAr" defaultValue={q?.labelAr} required dir="rtl" className={inputCls} /></Field>
      <Field label="Months"><input name="tenorMonths" type="number" min={1} defaultValue={q?.tenorMonths} required className={inputCls} /></Field>
      <Field label="Yield %"><input name="yieldPct" type="number" step="0.01" defaultValue={q?.yieldPct} required className={inputCls} /></Field>
      <Field label="Coupons/yr"><input name="couponsPerYear" type="number" min={0} max={12} defaultValue={q?.couponsPerYear ?? 0} required className={inputCls} /></Field>
      <Field label="Tax %"><input name="taxRatePct" type="number" step="0.5" min={0} max={100} defaultValue={q?.taxRatePct ?? ""} placeholder="—" className={inputCls} /></Field>
      <Field label="Order"><input name="sortOrder" type="number" min={0} defaultValue={q?.sortOrder ?? 0} className={inputCls} /></Field>
      <Field label="As of"><input name="asOf" type="date" defaultValue={q ? q.asOf.toISOString().slice(0, 10) : today} required className={inputCls} /></Field>
      <div className="col-span-full grid grid-cols-2 gap-2 border-t border-line pt-2 md:grid-cols-[6rem_8.5rem_10rem_8rem]">
        <Field label="Coupon %"><input name="couponRatePct" type="number" step="0.0001" min={0} max={100} defaultValue={q?.couponRatePct ?? ""} placeholder="—" className={inputCls} /></Field>
        <Field label="Maturity date"><input name="maturityDate" type="date" defaultValue={q?.maturityDate ? q.maturityDate.toISOString().slice(0, 10) : ""} className={inputCls} /></Field>
        <Field label="ISIN"><input name="isin" defaultValue={q?.isin ?? ""} placeholder="XS…" className={inputCls} /></Field>
        <Field label="Min. order"><input name="minInvestment" type="number" min={0} step="1000" defaultValue={q?.minInvestment ?? ""} placeholder="—" className={inputCls} /></Field>
      </div>
      <div className="col-span-full grid grid-cols-2 gap-2 md:grid-cols-[6rem_1fr_1fr_8.5rem]">
        <Field label="Bank equiv. %"><input name="bankRatePct" type="number" step="0.01" min={0} max={100} defaultValue={q?.bankRatePct ?? ""} placeholder="—" className={inputCls} /></Field>
        <Field label="Bank label (English)"><input name="bankLabelEn" defaultValue={q?.bankLabelEn ?? ""} placeholder="Bank A · 12-month deposit" className={inputCls} /></Field>
        <Field label="Bank label (Arabic)"><input name="bankLabelAr" defaultValue={q?.bankLabelAr ?? ""} dir="rtl" className={inputCls} /></Field>
        <Field label="Bank rate as of"><input name="bankAsOf" type="date" defaultValue={q?.bankAsOf ? q.bankAsOf.toISOString().slice(0, 10) : ""} className={inputCls} /></Field>
      </div>
      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
        <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="active" defaultChecked={q?.active ?? true} /> Show</label>
        <button className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-onprimary">{q ? "Save" : "Add"}</button>
        {q && <button formAction={deleteQuote} className="text-xs text-accent">Delete</button>}
      </div>
    </form>
  );
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted">
        Indicative annual yields, before taxes and fees. &ldquo;Coupons/yr&rdquo; 0 means paid at maturity (T-bills). &ldquo;Tax %&rdquo; is the withholding tax used for the after-tax view (20 for T-bills and bonds). Fill in &ldquo;Bank equiv.&rdquo; with the rate of a comparable bank deposit or CD for the same maturity (bank interest is tax-free) and the row appears in the &ldquo;side by side with bank deposits&rdquo; section. The landing page updates as soon as you save. Unticked &ldquo;Show&rdquo; rows are hidden. Coupon, maturity, ISIN and minimum order appear on each security&apos;s own page (leave the coupon empty for T-bills).
      </p>
      {error && <p className="text-sm text-accent">Couldn&apos;t save: check the &ldquo;{error}&rdquo; field.</p>}
      {saved && <p className="text-sm text-primary">Saved.</p>}
      {quotes.map((q) => row(q))}
      <h3 className="mt-4 font-semibold">Add a rate</h3>
      {row()}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs text-muted">
      {label}
      {children}
    </label>
  );
}

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "";
}

async function Waitlist() {
  const users = await prisma.waitlistUser.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { _count: { select: { referrals: true } } },
  });
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Latest {users.length} sign-ups</h2>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download from a route handler */}
        <a href="/admin/export?type=waitlist" className="btn-ghost px-4 py-2 text-sm">Download CSV</a>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-card ring-1 ring-line/60">
        <table className="w-full min-w-[64rem] text-sm">
          <thead className="text-start text-xs text-muted">
            <tr>{["Joined", "Name", "Email", "Mobile", "Lang", "Via", "Confirmed", "Friends", "Source", "Note"].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="num whitespace-nowrap px-3 py-2">{fmt(u.createdAt)}</td>
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="num px-3 py-2">{u.phone}</td>
                <td className="px-3 py-2">{u.locale}</td>
                <td className="px-3 py-2">{u.provider}</td>
                <td className="px-3 py-2">{u.emailVerifiedAt ? "Yes" : "No"}{u.unsubscribedAt ? " · unsubscribed" : ""}</td>
                <td className="num px-3 py-2">{u._count.referrals}</td>
                <td className="px-3 py-2">{[u.utmSource, u.utmCampaign].filter(Boolean).join(" / ")}</td>
                <td className="max-w-xs whitespace-pre-wrap px-3 py-2 text-muted">{u.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function Partners() {
  const rows = await prisma.partnerRequest.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{rows.length} partner requests</h2>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download from a route handler */}
        <a href="/admin/export?type=partners" className="btn-ghost px-4 py-2 text-sm">Download CSV</a>
      </div>
      {rows.map((r) => (
        <article key={r.id} className="grid gap-1 rounded-3xl bg-card p-5 ring-1 ring-line/60">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold">{r.institution} <span className="text-sm font-normal text-muted">· {r.type}</span></h3>
            <span className="num text-xs text-muted">{fmt(r.createdAt)}</span>
          </div>
          <p className="text-sm">{r.name}{r.role ? `, ${r.role}` : ""} · <span className="select-all">{r.email}</span>{r.phone ? ` · ${r.phone}` : ""}</p>
          {r.message && <p className="whitespace-pre-wrap text-sm text-muted">{r.message}</p>}
        </article>
      ))}
    </section>
  );
}

/** Brand kit: logo files, social images, colours and fonts, ready to download for posts and decks. */
const BRAND_FILES: { file: string; label: string; use: string; dark?: boolean }[] = [
  { file: "/brand/agyal-lockup-en.png", label: "Logo, English", use: "Websites, documents, light backgrounds" },
  { file: "/brand/agyal-lockup-ar.png", label: "Logo, Arabic", use: "Arabic posts and documents" },
  { file: "/brand/agyal-lockup-en-white.png", label: "Logo, English (white)", use: "Dark or photo backgrounds", dark: true },
  { file: "/brand/agyal-lockup-ar-white.png", label: "Logo, Arabic (white)", use: "Dark or photo backgrounds", dark: true },
  { file: "/brand/agyal-mark.svg", label: "Mark only (SVG)", use: "Favicons, small spaces, print" },
  { file: "/brand/agyal-mark-white.svg", label: "Mark only, white (SVG)", use: "On dark backgrounds", dark: true },
  { file: "/brand/agyal-app-icon.svg", label: "App icon (SVG)", use: "App stores, rounded icons" },
  { file: "/brand/agyal-profile-1024.png", label: "Profile picture 1024×1024", use: "Instagram, Facebook, LinkedIn, X, WhatsApp" },
  { file: "/og/og-en.png", label: "Link preview, English (1200×630)", use: "Shown when agyal.net/en is shared" },
  { file: "/og/og-ar.png", label: "Link preview, Arabic (1200×630)", use: "Shown when agyal.net/ar is shared" },
];
const BRAND_COLOURS = [
  ["Lapis (primary)", "#1D47A3"],
  ["Carnelian (accent)", "#D0643A"],
  ["Ink (text)", "#0F1630"],
  ["Paper (background)", "#F4F5FA"],
  ["Muted (secondary text)", "#5D6478"],
] as const;

function Brand() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-2 rounded-3xl bg-card p-6 ring-1 ring-line/60">
        <h2 className="text-lg font-semibold">Brand kit</h2>
        <p className="text-sm text-muted">
          Logo, colours and fonts for social posts, decks and partner documents. Click a file to open it, or use Download.
          The original brand board (logo options and rationale) is at{" "}
          <a className="text-primary underline" href="https://claude.ai/artifact/VaZsvyn5Dg7UwdquMcngFz" target="_blank" rel="noreferrer">
            the brand board
          </a>
          .
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRAND_FILES.map((f) => (
          <figure key={f.file} className="grid gap-3 rounded-3xl bg-card p-4 ring-1 ring-line/60">
            <a href={f.file} target="_blank" rel="noreferrer" className={`block h-36 overflow-hidden rounded-2xl p-4 ${f.dark ? "bg-[#0F1630]" : "bg-[#F4F5FA]"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.file} alt={f.label} className="h-full w-full object-contain" />
            </a>
            <figcaption className="grid gap-1 text-sm">
              <span className="font-semibold">{f.label}</span>
              <span className="text-muted">{f.use}</span>
              <a href={f.file} download className="w-fit text-primary underline">
                Download
              </a>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="grid gap-4 rounded-3xl bg-card p-6 ring-1 ring-line/60">
        <h2 className="text-lg font-semibold">Colours</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          {BRAND_COLOURS.map(([name, hex]) => (
            <div key={hex} className="grid gap-2">
              <span className="h-16 rounded-2xl ring-1 ring-line" style={{ background: hex }} />
              <span className="text-sm font-semibold">{name}</span>
              <span className="select-all font-mono text-xs text-muted">{hex}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2 rounded-3xl bg-card p-6 text-sm ring-1 ring-line/60">
        <h2 className="text-lg font-semibold">Fonts</h2>
        <p>
          <span className="font-semibold">English:</span> SF Pro (Apple system font); use Inter or Helvetica where SF isn&apos;t available.
        </p>
        <p>
          <span className="font-semibold">Arabic:</span>{" "}
          <a className="text-primary underline" href="https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic" target="_blank" rel="noreferrer">
            IBM Plex Sans Arabic
          </a>{" "}
          (free, Google Fonts).
        </p>
        <p className="text-muted">Numbers: always Western digits (24.15%) in both languages.</p>
      </section>
    </div>
  );
}
