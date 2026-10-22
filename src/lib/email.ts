import { Resend } from "resend";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

const FROM = process.env.EMAIL_FROM || "AGYAL <hello@agyal.net>";

/**
 * Send an email. In development (EMAIL_PROVIDER=console, the default) messages
 * are printed to the server console so the app runs with no external account.
 * Set EMAIL_PROVIDER=resend + RESEND_API_KEY in production to actually send.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || "console";
  const recipients = Array.isArray(message.to) ? message.to : [message.to];

  if (recipients.length === 0) return;

  if (provider === "resend" && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo || process.env.EMAIL_REPLY_TO || undefined,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
    return;
  }

  // Console fallback.
  // eslint-disable-next-line no-console
  console.log(
    [
      "",
      "──────────── EMAIL (console mode) ────────────",
      `From:    ${FROM}`,
      `To:      ${recipients.join(", ")}`,
      `Subject: ${message.subject}`,
      "----------------------------------------------",
      message.text,
      "──────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}
