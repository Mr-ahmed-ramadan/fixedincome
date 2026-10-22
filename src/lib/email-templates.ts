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

/** Client-safe HTML email shell: brand row, body blocks, footer (with optional unsubscribe link). */
function layout(locale: Locale, blocks: string, foot: string, unsubscribe?: { label: string; href: string }): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const font =
    locale === "ar"
      ? "'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif"
      : "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const brand = getDictionary(locale).brand;
  const unsub = unsubscribe
    ? `<br><a href="${escape(unsubscribe.href)}" style="color:${BRAND.muted};text-decoration:underline">${escape(unsubscribe.label)}</a>`
    : "";
  return `<!doctype html><html lang="${locale}" dir="${dir}"><body style="margin:0;background:${BRAND.paper};font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;padding:32px" dir="${dir}">
<tr><td style="padding-bottom:24px;font-size:20px;font-weight:700;color:${BRAND.ink}">${LADDER}&nbsp;&nbsp;${escape(brand)}</td></tr>
<tr><td>${blocks}</td></tr>
<tr><td style="padding-top:20px;border-top:1px solid #E6E8F0;font-size:12px;line-height:1.5;color:${BRAND.muted}">${escape(foot)}${unsub}</td></tr>
</table></td></tr></table></body></html>`;
}

export function verifyEmail(locale: Locale, name: string, link: string) {
  const t = getDictionary(locale).emails;
  return {
    subject: t.verifySubject,
    text: `${t.verifyBody(name)}\n\n${link}\n\n${t.verifyFoot}\n${t.spamNote}`,
    html: layout(locale, P(t.verifyBody(name)) + BUTTON(t.verifyCta, link) + SMALL(t.verifyFoot) + SMALL(t.spamNote), t.foot),
  };
}

export function welcomeEmail(locale: Locale, name: string, invite: string, unsubscribeUrl: string) {
  const t = getDictionary(locale).emails;
  return {
    subject: t.welcomeSubject,
    text: `${t.welcomeIntro(name)}\n\n${timelineText(locale)}\n\n${t.inviteText}\n${invite}\n\n${t.spamNote}\n\n${t.foot}\n${t.unsubscribe}: ${unsubscribeUrl}`,
    html: layout(
      locale,
      P(t.welcomeIntro(name)) + timelineHtml(locale) + P(t.inviteText) + BUTTON(invite.replace(/^https?:\/\//, ""), invite) + SMALL(t.spamNote),
      t.foot,
      { label: t.unsubscribe, href: unsubscribeUrl },
    ),
  };
}

/** Sent to a broker/bank after they submit the partner form. */
export function partnerAckEmail(locale: Locale, name: string, institution: string, calUrl: string) {
  const t = getDictionary(locale).emails;
  const cal = calUrl ? P(t.partnerCal) + BUTTON(t.partnerCalCta, calUrl) : "";
  return {
    subject: t.partnerSubject,
    text: `${t.partnerBody(name, institution)}${calUrl ? `\n\n${t.partnerCal} ${calUrl}` : ""}\n\n${t.spamNote}\n\n${t.partnerFoot}`,
    html: layout(locale, P(t.partnerBody(name, institution)) + cal + SMALL(t.spamNote), t.partnerFoot),
  };
}
