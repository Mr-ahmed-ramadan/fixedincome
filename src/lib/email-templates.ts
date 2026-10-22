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

/** A simple, client-safe HTML email: brand row, paragraphs, one button, footer. */
function layout(locale: Locale, paragraphs: string[], cta: { label: string; href: string }, foot: string): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const font =
    locale === "ar"
      ? "'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif"
      : "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const brand = getDictionary(locale).brand;
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink}">${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!doctype html><html lang="${locale}" dir="${dir}"><body style="margin:0;background:${BRAND.paper};font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;padding:32px" dir="${dir}">
<tr><td style="padding-bottom:24px;font-size:20px;font-weight:700;color:${BRAND.ink}">${LADDER}&nbsp;&nbsp;${escape(brand)}</td></tr>
<tr><td>${body}
<p style="margin:8px 0 24px"><a href="${escape(cta.href)}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 24px;border-radius:12px">${escape(cta.label)}</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.muted};word-break:break-all">${escape(cta.href)}</p>
</td></tr>
<tr><td style="padding-top:24px;border-top:1px solid #E6E8F0;font-size:12px;line-height:1.5;color:${BRAND.muted}">${escape(foot)}</td></tr>
</table></td></tr></table></body></html>`;
}

export function verifyEmail(locale: Locale, name: string, link: string) {
  const t = getDictionary(locale).emails;
  return {
    subject: t.verifySubject,
    text: `${t.verifyBody(name)}\n\n${link}\n\n${t.verifyFoot}`,
    html: layout(locale, [t.verifyBody(name)], { label: t.verifyCta, href: link }, t.verifyFoot),
  };
}

export function welcomeEmail(locale: Locale, name: string, invite: string) {
  const t = getDictionary(locale).emails;
  return {
    subject: t.welcomeSubject,
    text: `${t.welcomeBody(name)}\n\n${invite}\n\n${t.welcomeFoot}`,
    html: layout(locale, [t.welcomeBody(name)], { label: invite.replace(/^https?:\/\//, ""), href: invite }, t.welcomeFoot),
  };
}

export function partnerNotification(p: {
  institution: string;
  type: string;
  name: string;
  role?: string | null;
  email: string;
  phone?: string | null;
  message?: string | null;
  locale: string;
}) {
  const lines = [
    `Institution: ${p.institution} (${p.type})`,
    `Contact: ${p.name}${p.role ? `, ${p.role}` : ""}`,
    `Email: ${p.email}`,
    `Phone: ${p.phone || "-"}`,
    `Language: ${p.locale}`,
    "",
    p.message || "(no message)",
  ];
  return { subject: `New partner request: ${p.institution}`, text: lines.join("\n") };
}
