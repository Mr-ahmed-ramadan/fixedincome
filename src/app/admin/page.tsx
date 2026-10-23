import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { CURRENCIES, INSTRUMENTS } from "@/lib/yields";
import { Wordmark } from "@/components/logo";
import { CopyButton } from "@/components/copy-button";
import { TASK_KINDS, trackedLink } from "@/lib/validation";
import { emailDailyCap, keys, peek } from "@/lib/limits";
import { milestones, statusOf } from "@/lib/milestones";
import { CAL_URL, googleEnabled } from "@/lib/site";
import { addTask, sendPending, toggleMilestone, cycleChannelStatus, cycleTaskStatus, deleteQuote, deleteTask, login, logout, saveQuote, updateChannel, updateTask } from "./actions";

export const dynamic = "force-dynamic";

type Search = Promise<{ tab?: string; error?: string; saved?: string; sentPending?: string; leftPending?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  if (!(await isAdmin())) return <Login failed={Boolean(sp.error)} configured={Boolean(process.env.ADMIN_PASSWORD)} />;

  const tab = sp.tab ?? "overview";
  const tabs = [
    ["overview", "Overview"],
    ["yields", "Yields"],
    ["waitlist", "Waitlist"],
    ["partners", "Partners"],
    ["marketing", "Marketing"],
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
      {tab === "overview" && <Overview sentPending={sp.sentPending} leftPending={sp.leftPending} />}
      {tab === "brand" && <Brand />}
      {tab === "marketing" && <Marketing error={sp.error} />}
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

async function Overview({ sentPending, leftPending }: { sentPending?: string; leftPending?: string }) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const [emailsToday, emailsThisMonth, blockedToday, pending, signupsThisMonth, doneRows] = await Promise.all([
    peek(keys.emailToday()),
    peek(keys.emailMonth()),
    peek(keys.blockedToday()),
    prisma.waitlistUser.count({ where: { pendingEmail: { not: null }, unsubscribedAt: null } }),
    prisma.waitlistUser.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.appMeta.findMany({ where: { key: { startsWith: "milestone-done:" } } }),
  ]);
  const cap = emailDailyCap();
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
      <section className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-line/60">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Capacity</h2>
          <span className="text-xs text-muted">Daily email cap is set by EMAIL_DAILY_CAP (now {cap}); raise it after upgrading the email plan.</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <span className="text-xs text-muted">Emails sent today (UTC)</span>
            <span className="num text-2xl font-bold">
              {emailsToday} <span className="text-base font-medium text-muted">/ {cap}</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-ink/5">
              <span className={`block h-full rounded-full ${emailsToday >= cap ? "bg-accent" : "bg-primary"}`} style={{ width: `${Math.min(100, (emailsToday / cap) * 100)}%` }} />
            </span>
          </div>
          <div className="grid content-start gap-1.5">
            <span className="text-xs text-muted">Emails waiting to be sent</span>
            <span className={`num text-2xl font-bold ${pending ? "text-accent" : ""}`}>{pending}</span>
            {pending > 0 && (
              <form action={sendPending}>
                <button className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-onprimary">Send now (up to 50)</button>
              </form>
            )}
            {sentPending != null && <span className="text-xs text-muted">Sent {sentPending}; {leftPending} still waiting.</span>}
          </div>
          <div className="grid content-start gap-1.5">
            <span className="text-xs text-muted">Blocked attempts today (too many from one connection)</span>
            <span className="num text-2xl font-bold">{blockedToday}</span>
          </div>
        </div>
      </section>
      <Milestones
        done={new Set(doneRows.map((r) => r.key.replace("milestone-done:", "")))}
        metrics={{
          emailsToday,
          emailsThisMonth,
          emailDailyCap: cap,
          pendingEmails: pending,
          signupsThisMonth,
          signupsTotal: total,
          partnerRequests: partners,
          blockedToday,
          calUrlSet: Boolean(CAL_URL),
          googleSignInSet: googleEnabled(),
        }}
      />
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

// --- Marketing: launch plan, channels and where sign-ups come from.
const WEEK_LABEL = ["Week 0 · Set up", "Week 1 · First content", "Week 2", "Week 3", "Week 4"];
const STATUS_STYLE: Record<string, string> = {
  TODO: "bg-ink/5 text-muted",
  DOING: "bg-accent/15 text-accent",
  DONE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  CREATED: "bg-accent/15 text-accent",
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};
const STATUS_LABEL: Record<string, string> = { TODO: "To do", DOING: "In progress", DONE: "Done", CREATED: "Created", ACTIVE: "Active" };

function StatusButton({ action, name, value, status }: { action: (f: FormData) => Promise<void>; name: string; value: string; status: string }) {
  return (
    <form action={action}>
      <input type="hidden" name={name} value={value} />
      <button title="Click to change status" className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status] ?? ""}`}>
        {status === "DONE" ? "✓ " : ""}
        {STATUS_LABEL[status] ?? status}
      </button>
    </form>
  );
}

async function Marketing({ error }: { error?: string }) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [channels, tasks, total, verified, lastWeek, bySource, verifiedBySource] = await Promise.all([
    prisma.marketingChannel.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.marketingTask.findMany({ orderBy: [{ week: "asc" }, { sortOrder: "asc" }] }),
    prisma.waitlistUser.count(),
    prisma.waitlistUser.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.waitlistUser.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.waitlistUser.groupBy({ by: ["utmSource"], _count: { _all: true } }),
    prisma.waitlistUser.groupBy({ by: ["utmSource"], where: { emailVerifiedAt: { not: null } }, _count: { _all: true } }),
  ]);
  const count = (rows: { utmSource: string | null; _count: { _all: number } }[], key: string | null) =>
    rows.find((r) => r.utmSource === key)?._count._all ?? 0;
  const known = new Set(channels.map((c) => c.key));
  const other = bySource.filter((r) => r.utmSource && !known.has(r.utmSource)).reduce((n, r) => n + r._count._all, 0);
  const weeks = [...new Set(tasks.map((t) => t.week))].sort((a, b) => a - b);
  const done = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Waitlist" value={total} />
        <Card label="Confirmed email" value={verified} hint={total ? `${Math.round((verified / total) * 100)}%` : undefined} />
        <Card label="Joined this week" value={lastWeek} />
        <Card label="Plan progress" value={`${done}/${tasks.length}`} hint="tasks done" />
      </div>

      <section className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-line/60">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Channels</h2>
          <span className="text-xs text-muted">Put the tagged link in each bio and post; sign-ups from it are counted here.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 text-start font-medium">Channel</th>
                <th className="py-2 text-start font-medium">Status</th>
                <th className="py-2 text-start font-medium">Handle · profile URL</th>
                <th className="py-2 text-start font-medium">Tagged link</th>
                <th className="py-2 text-end font-medium">Sign-ups</th>
                <th className="py-2 text-end font-medium">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.key} className="border-t border-line align-top">
                  <td className="py-3 pe-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="max-w-[16rem] text-xs text-muted">{c.audience}</div>
                  </td>
                  <td className="py-3 pe-3">
                    <StatusButton action={cycleChannelStatus} name="key" value={c.key} status={c.status} />
                  </td>
                  <td className="py-3 pe-3">
                    <form action={updateChannel} className="flex flex-wrap gap-1.5">
                      <input type="hidden" name="key" value={c.key} />
                      <input name="handle" defaultValue={c.handle ?? ""} placeholder="@agyal" className={`${inputCls} w-28`} />
                      <input name="url" defaultValue={c.url ?? ""} placeholder="https://…" className={`${inputCls} w-44`} />
                      <button className="rounded-xl px-2 text-xs font-semibold text-primary hover:underline">Save</button>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noreferrer" className="self-center text-xs text-primary underline">
                          Open
                        </a>
                      )}
                    </form>
                  </td>
                  <td className="py-3 pe-3">
                    <div className="flex items-center gap-2">
                      <code className="max-w-[14rem] truncate text-xs text-muted">{trackedLink(c.key).replace("https://", "")}</code>
                      <CopyButton text={trackedLink(c.key)} />
                    </div>
                  </td>
                  <td className="num py-3 text-end font-semibold">{count(bySource, c.key)}</td>
                  <td className="num py-3 text-end">{count(verifiedBySource, c.key)}</td>
                </tr>
              ))}
              <tr className="border-t border-line text-muted">
                <td className="py-3" colSpan={4}>
                  Direct / untagged{other ? ` · other tags: ${other}` : ""}
                </td>
                <td className="num py-3 text-end font-semibold">{count(bySource, null)}</td>
                <td className="num py-3 text-end">{count(verifiedBySource, null)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 rounded-3xl bg-card p-5 ring-1 ring-line/60">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">30-day launch plan</h2>
          <span className="text-xs text-muted">Click a status to move it on: To do → In progress → Done. Paste the posted link when a post goes live.</span>
        </div>
        {weeks.map((w) => {
          const list = tasks.filter((t) => t.week === w);
          const wDone = list.filter((t) => t.status === "DONE").length;
          return (
            <div key={w} className="grid gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">{WEEK_LABEL[w] ?? `Week ${w}`}</h3>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${list.length ? (wDone / list.length) * 100 : 0}%` }} />
                </div>
                <span className="num text-xs text-muted">
                  {wDone}/{list.length}
                </span>
              </div>
              <ul className="grid divide-y divide-line rounded-2xl ring-1 ring-line/60">
                {list.map((t) => (
                  <li key={t.id} className={`grid gap-2 p-3 md:grid-cols-[auto_1fr_auto] md:items-start ${t.status === "DONE" ? "opacity-60" : ""}`}>
                    <StatusButton action={cycleTaskStatus} name="id" value={t.id} status={t.status} />
                    <div className="grid gap-1">
                      <span className={`font-medium ${t.status === "DONE" ? "line-through" : ""}`}>{t.title}</span>
                      <span className="flex flex-wrap gap-1.5 text-xs text-muted">
                        <span className={`rounded px-1.5 font-semibold ${t.owner === "CLAUDE" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
                          {t.owner === "CLAUDE" ? "Claude" : "You"}
                        </span>
                        <span>{t.kind.toLowerCase()}</span>
                        {t.channel !== "all" && <span>· {channels.find((c) => c.key === t.channel)?.name ?? t.channel}</span>}
                        {t.dueDate && <span>· due {t.dueDate.toISOString().slice(0, 10)}</span>}
                        {t.link && (
                          <a href={t.link} target="_blank" rel="noreferrer" className="text-primary underline">
                            · link
                          </a>
                        )}
                      </span>
                      {t.notes && <span className="text-xs text-ink/70">{t.notes}</span>}
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-primary">Edit</summary>
                      <form action={updateTask} className="mt-2 grid w-64 gap-1.5">
                        <input type="hidden" name="id" value={t.id} />
                        <input name="link" defaultValue={t.link ?? ""} placeholder="Posted link" className={inputCls} />
                        <textarea name="notes" defaultValue={t.notes ?? ""} placeholder="Notes" rows={2} className={inputCls} />
                        <button className="rounded-xl bg-primary px-3 py-1.5 font-semibold text-onprimary">Save</button>
                      </form>
                      <form action={deleteTask} className="mt-1.5">
                        <input type="hidden" name="id" value={t.id} />
                        <button className="text-muted hover:text-accent">Delete task</button>
                      </form>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-line/60">
        <h2 className="font-semibold">Add a task</h2>
        {error === "task" && <p className="text-sm font-medium text-accent">Please give the task a title.</p>}
        <form action={addTask} className="grid gap-2 sm:grid-cols-[5rem_1fr_9rem_8rem_7rem_9rem_auto] sm:items-end">
          <Field label="Week">
            <input name="week" type="number" min={0} max={52} defaultValue={1} className={inputCls} />
          </Field>
          <Field label="Task">
            <input name="title" required placeholder="e.g. Post explainer 5 on TikTok" className={inputCls} />
          </Field>
          <Field label="Channel">
            <select name="channel" className={inputCls} defaultValue="all">
              <option value="all">All</option>
              {channels.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select name="kind" className={inputCls} defaultValue="CONTENT">
              {TASK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Owner">
            <select name="owner" className={inputCls} defaultValue="YOU">
              <option value="YOU">You</option>
              <option value="CLAUDE">Claude</option>
            </select>
          </Field>
          <Field label="Due">
            <input name="dueDate" type="date" className={inputCls} />
          </Field>
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-onprimary">Add</button>
        </form>
      </section>
    </div>
  );
}

// --- Growth milestones: what to upgrade or set up, and when.
const MILESTONE_STYLE = {
  hit: { pill: "bg-accent text-white", label: "Action needed", bar: "bg-accent" },
  soon: { pill: "bg-accent/15 text-accent", label: "Coming up", bar: "bg-accent/70" },
  ok: { pill: "bg-ink/5 text-muted", label: "Fine for now", bar: "bg-primary" },
} as const;

function Milestones({ metrics, done }: { metrics: Parameters<typeof milestones>[0]; done: Set<string> }) {
  const order = { hit: 0, soon: 1, ok: 2 } as const;
  const list = milestones(metrics)
    .map((m) => ({ ...m, status: m.manual ? ("soon" as const) : statusOf(m), isDone: done.has(m.id) }))
    .sort((a, b) => Number(a.isDone) - Number(b.isDone) || order[a.status] - order[b.status]);
  const open = list.filter((m) => !m.isDone && m.status !== "ok").length;
  return (
    <section id="milestones" className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-line/60">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Milestones</h2>
        <span className="text-xs text-muted">
          {open ? `${open} need attention` : "Nothing to do right now"}. Each one tells you what to do when its number gets close.
        </span>
      </div>
      <ul className="grid gap-2">
        {list.map((m) => {
          const st = MILESTONE_STYLE[m.status];
          return (
            <li key={m.id} className={`grid gap-2 rounded-2xl p-4 ring-1 ring-line/60 md:grid-cols-[1fr_auto] ${m.isDone ? "opacity-50" : ""}`}>
              <div className="grid gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.isDone ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : st.pill}`}>
                    {m.isDone ? "✓ Done" : m.manual ? "Check once" : st.label}
                  </span>
                  <span className="font-semibold">{m.title}</span>
                </div>
                {!m.manual && (
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-40 overflow-hidden rounded-full bg-ink/5">
                      <span className={`block h-full rounded-full ${st.bar}`} style={{ width: `${Math.min(100, (m.value / m.limit) * 100)}%` }} />
                    </span>
                    <span className="num text-xs text-muted">
                      {m.value.toLocaleString("en-US")} / {m.limit.toLocaleString("en-US")} {m.unit}
                    </span>
                  </div>
                )}
                <p className="text-sm text-ink/80">
                  <span className="font-semibold">What to do: </span>
                  {m.action}
                  {m.cost && <span className="text-muted"> · {m.cost}</span>}
                </p>
                {m.link && (
                  <a href={m.link.href} target="_blank" rel="noreferrer" className="w-fit text-xs font-semibold text-primary underline">
                    {m.link.label} ↗
                  </a>
                )}
              </div>
              <form action={toggleMilestone} className="self-start">
                <input type="hidden" name="id" value={m.id} />
                <button className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30 hover:bg-primary/5">
                  {m.isDone ? "Undo" : "Mark done"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
