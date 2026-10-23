import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "./locale";

const BRAND = { primary: "#1D47A3", accent: "#D0643A", ink: "#0F1630", paper: "#F4F5FA", muted: "#5D6478" };

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const LADDER = `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:bottom"><tr valign="bottom">
<td style="padding:0 2px"><div style="width:6px;height:9px;border-radius:2px;background:${BRAND.primary};opacity:.45"></div></td>
<td style="padding:0 2px"><div style="width:6px;height:14px;border-radius:2px;background:${BRAND.primary};opacity:.72"></div></td>
<td style="padding:0 2px"><div style="width:6px;height:20px;border-radius:2px;background:${BRAND.primary}"></div></td>
</tr></table>`;

const P = (text: string, style = "") =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};${style}">${escape(text).replace(/\n/g, "<br>")}</p>`;
const SMALL = (text: string) => `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${BRAND.muted}">${escape(text)}</p>`;
const BUTTON = (label: string, href: string) =>
  `<p style="margin:8px 0 12px"><a href="${escape(href)}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 24px;border-radius:12px">${escape(label)}</a></p>
<p style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${BRAND.muted};word-break:break-all">${escape(href)}</p>`;

/** "Where we are": done steps ticked, the current step highlighted, the rest greyed. */
function timelineHtml(locale: Locale): string {
  const tl = getDictionary(locale).timeline;
  const rows = tl.steps
    .map((step, i) => {
      const done = i < tl.current;
      const now = i === tl.current;
      const dot = done ? "&#10003;" : now ? "&#9679;" : "&#9675;";
      const color = done || now ? BRAND.primary : "#A3A9BA";
      const badge = now
        ? ` <span style="display:inline-block;background:${BRAND.accent};color:#ffffff;font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px;vertical-align:middle">${escape(tl.now)}</span>`
        : "";
      return `<tr><td valign="top" style="width:28px;padding:6px 0;font-size:16px;font-weight:700;color:${color}">${dot}</td>
<td style="padding:6px 0"><div style="font-size:15px;font-weight:${now ? 700 : 600};color:${done || now ? BRAND.ink : "#7A8094"}">${escape(step.t)}${badge}</div>
<div style="font-size:13px;line-height:1.5;color:${BRAND.muted}">${escape(step.d)}</div></td></tr>`;
    })
    .join("");
  return `<div style="margin:4px 0 20px;padding:16px 18px;background:${BRAND.paper};border-radius:14px">
<div style="font-size:13px;font-weight:700;letter-spacing:.04em;color:${BRAND.accent};margin-bottom:6px">${escape(tl.title)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table></div>`;
}

function timelineText(locale: Locale): string {
  const tl = getDictionary(locale).timeline;
  return [
    tl.title,
    ...tl.steps.map((s, i) => `${i < tl.current ? "[x]" : i === tl.current ? "[>]" : "[ ]"} ${s.t}${i === tl.current ? ` (${tl.now})` : ""}: ${s.d}`),
  ].join("\n");
}

/** Every email carries both languages, in this order. Swap to put Arabic first. */
export const EMAIL_LANGS: Locale[] = ["en", "ar"];

const FONT: Record<Locale, string> = {
  ar: "'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif",
  en: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
};
const LANG_LABEL: Record<Locale, string> = { en: "English", ar: "العربية" };

/** One block per language: its own direction and font, with a labelled divider before the second. */
function bilingualHtml(build: (lang: Locale) => string): string {
  return EMAIL_LANGS.map((lang, i) => {
    const divider =
      i === 0
        ? ""
        : `<div style="margin:8px 0 20px;border-top:1px solid #E6E8F0;padding-top:16px;font-size:12px;font-weight:700;letter-spacing:.04em;color:${BRAND.accent}" dir="${lang === "ar" ? "rtl" : "ltr"}">${LANG_LABEL[lang]}</div>`;
    return `${divider}<div lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}" style="font-family:${FONT[lang]};text-align:${lang === "ar" ? "right" : "left"}">${build(lang)}</div>`;
  }).join("");
}

function bilingualText(build: (lang: Locale) => string): string {
  return EMAIL_LANGS.map((lang, i) => (i === 0 ? "" : `\n\n— ${LANG_LABEL[lang]} —\n\n`) + build(lang)).join("");
}

const bilingualSubject = (pick: (t: ReturnType<typeof getDictionary>["emails"]) => string) =>
  EMAIL_LANGS.map((lang) => pick(getDictionary(lang).emails)).join(" | ");

/** Client-safe HTML email shell: brand row, body blocks, footers in both languages (with optional unsubscribe link). */
function layout(blocks: string, foot: (lang: Locale) => string, unsubscribe?: string): string {
  const unsub = unsubscribe
    ? `<p style="margin:12px 0 0"><a href="${escape(unsubscribe)}" style="color:${BRAND.muted};text-decoration:underline">${EMAIL_LANGS.map((l) => escape(getDictionary(l).emails.unsubscribe)).join(" · ")}</a></p>`
    : "";
  const foots = EMAIL_LANGS.map(
    (l) => `<p lang="${l}" dir="${l === "ar" ? "rtl" : "ltr"}" style="margin:0 0 8px;font-family:${FONT[l]};text-align:${l === "ar" ? "right" : "left"}">${escape(foot(l))}</p>`,
  ).join("");
  return `<!doctype html><html lang="${EMAIL_LANGS[0]}"><body style="margin:0;background:${BRAND.paper};font-family:${FONT[EMAIL_LANGS[0]]}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;padding:32px">
<tr><td style="padding-bottom:24px;font-size:20px;font-weight:700;color:${BRAND.ink}">${LADDER}&nbsp;&nbsp;AGYAL · أجيال</td></tr>
<tr><td>${blocks}</td></tr>
<tr><td style="padding-top:20px;border-top:1px solid #E6E8F0;font-size:12px;line-height:1.5;color:${BRAND.muted}">${foots}${unsub}</td></tr>
</table></td></tr></table></body></html>`;
}

// `locale` is the language the person signed up in; it only decides which pages the links open.
// The content always comes in both languages (EMAIL_LANGS).

export function verifyEmail(_locale: Locale, name: string, link: string) {
  const tt = (l: Locale) => getDictionary(l).emails;
  return {
    subject: bilingualSubject((t) => t.verifySubject),
    text: bilingualText((l) => `${tt(l).verifyBody(name)}\n\n${link}\n\n${tt(l).verifyFoot}\n${tt(l).spamNote}`),
    html: layout(
      bilingualHtml((l) => P(tt(l).verifyBody(name)) + BUTTON(tt(l).verifyCta, link) + SMALL(tt(l).verifyFoot) + SMALL(tt(l).spamNote)),
      (l) => tt(l).foot,
    ),
  };
}

export function welcomeEmail(_locale: Locale, name: string, invite: string, unsubscribeUrl: string) {
  const tt = (l: Locale) => getDictionary(l).emails;
  return {
    subject: bilingualSubject((t) => t.welcomeSubject),
    text:
      bilingualText((l) => `${tt(l).welcomeIntro(name)}\n\n${timelineText(l)}\n\n${tt(l).inviteText}\n${invite}\n\n${tt(l).spamNote}\n\n${tt(l).foot}`) +
      `\n\n${EMAIL_LANGS.map((l) => tt(l).unsubscribe).join(" · ")}: ${unsubscribeUrl}`,
    html: layout(
      bilingualHtml(
        (l) => P(tt(l).welcomeIntro(name)) + timelineHtml(l) + P(tt(l).inviteText) + BUTTON(invite.replace(/^https?:\/\//, ""), invite) + SMALL(tt(l).spamNote),
      ),
      (l) => tt(l).foot,
      unsubscribeUrl,
    ),
  };
}

/** Sent to a broker/bank after they submit the partner form. */
export function partnerAckEmail(_locale: Locale, name: string, institution: string, calUrl: string) {
  const tt = (l: Locale) => getDictionary(l).emails;
  return {
    subject: bilingualSubject((t) => t.partnerSubject),
    text: bilingualText(
      (l) => `${tt(l).partnerBody(name, institution)}${calUrl ? `\n\n${tt(l).partnerCal} ${calUrl}` : ""}\n\n${tt(l).spamNote}\n\n${tt(l).partnerFoot}`,
    ),
    html: layout(
      bilingualHtml(
        (l) => P(tt(l).partnerBody(name, institution)) + (calUrl ? P(tt(l).partnerCal) + BUTTON(tt(l).partnerCalCta, calUrl) : "") + SMALL(tt(l).spamNote),
      ),
      (l) => tt(l).partnerFoot,
    ),
  };
}
