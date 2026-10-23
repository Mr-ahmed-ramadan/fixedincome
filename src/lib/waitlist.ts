import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { sendEmail } from "./email";
import { verifyEmail, welcomeEmail } from "./email-templates";
import { generateReferralCode } from "./referral";
import { createUnsubscribeToken, createVerifyToken } from "./tokens";
import { APP_URL, inviteUrl } from "./site";
import type { Attribution } from "./attribution";
import { isLocale, type Locale } from "./locale";
import { RESEND_AFTER, sentRecently, takeEmailBudget } from "./limits";

type NewMember = {
  name: string;
  email: string;
  phone?: string | null;
  note?: string | null;
  locale: Locale;
  provider: "email" | "google";
  verified: boolean;
  attribution: Attribution;
};

/** Create a waitlist member with a unique invite code, crediting whoever invited them. */
async function createMember(m: NewMember) {
  const referrer = m.attribution.ref
    ? await prisma.waitlistUser.findUnique({ where: { referralCode: m.attribution.ref }, select: { id: true } })
    : null;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.waitlistUser.create({
        data: {
          name: m.name,
          email: m.email,
          phone: m.phone ?? null,
          note: m.note ?? null,
          locale: m.locale,
          provider: m.provider,
          emailVerifiedAt: m.verified ? new Date() : null,
          referralCode: generateReferralCode(),
          referredById: referrer?.id ?? null,
          utmSource: m.attribution.utmSource,
          utmMedium: m.attribution.utmMedium,
          utmCampaign: m.attribution.utmCampaign,
          utmContent: m.attribution.utmContent,
        },
      });
    } catch (e) {
      // Retry only on an invite-code collision; a duplicate email is a real conflict.
      const target = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" ? String(e.meta?.target) : "";
      if (!target.includes("referralCode")) throw e;
    }
  }
  throw new Error("Could not allocate a referral code");
}

function memberLocale(locale: string): Locale {
  return isLocale(locale) ? locale : "ar";
}

/**
 * Send within today's email budget. Never throws: if the budget is used up or
 * the provider fails, the member is marked so /admin can send it later, and the
 * visitor still sees "check your inbox".
 */
async function sendOrQueue(userId: string, kind: "VERIFY" | "WELCOME", send: () => Promise<void>): Promise<boolean> {
  try {
    if (await takeEmailBudget()) {
      await send();
      return true;
    }
    console.warn(`Daily email cap reached; queued ${kind} for ${userId}`);
  } catch (e) {
    console.error(`Sending ${kind} failed; queued for ${userId}`, e);
  }
  await prisma.waitlistUser.update({ where: { id: userId }, data: { pendingEmail: kind } });
  return false;
}

export async function sendVerification(user: { id: string; name: string; email: string; locale: string }) {
  const locale = memberLocale(user.locale);
  const link = `${APP_URL}/${locale}/verify?token=${encodeURIComponent(createVerifyToken(user.id))}`;
  const sent = await sendOrQueue(user.id, "VERIFY", () => sendEmail({ to: user.email, ...verifyEmail(locale, user.name, link) }));
  if (sent) await prisma.waitlistUser.update({ where: { id: user.id }, data: { verifySentAt: new Date(), pendingEmail: null } });
  return sent;
}

export function unsubscribeUrl(user: { id: string; locale: string }) {
  return `${APP_URL}/${memberLocale(user.locale)}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(user.id))}`;
}

export async function sendWelcome(user: { id: string; name: string; email: string; locale: string; referralCode: string; unsubscribedAt?: Date | null }) {
  const locale = memberLocale(user.locale);
  if (user.unsubscribedAt) return false;
  const unsub = unsubscribeUrl(user);
  const sent = await sendOrQueue(user.id, "WELCOME", () =>
    sendEmail({
      to: user.email,
      ...welcomeEmail(locale, user.name, inviteUrl(locale, user.referralCode), unsub),
      headers: { "List-Unsubscribe": `<${unsub}>` },
    }),
  );
  if (sent) await prisma.waitlistUser.update({ where: { id: user.id }, data: { welcomeSentAt: new Date(), pendingEmail: null } });
  return sent;
}

/** Send queued emails (from /admin), oldest first, until the list or today's budget runs out. */
export async function sendPendingEmails(max = 50): Promise<{ sent: number; left: number }> {
  const users = await prisma.waitlistUser.findMany({ where: { pendingEmail: { not: null }, unsubscribedAt: null }, orderBy: { createdAt: "asc" }, take: max });
  let sent = 0;
  for (const u of users) {
    const ok = u.pendingEmail === "WELCOME" ? await sendWelcome(u) : await sendVerification(u);
    if (!ok) break; // budget used up or provider failing: stop and try again later
    sent++;
  }
  const left = await prisma.waitlistUser.count({ where: { pendingEmail: { not: null }, unsubscribedAt: null } });
  return { sent, left };
}

/**
 * Handle the email form. New people get a confirmation link; people who joined
 * before but never confirmed get a fresh link; confirmed members get their
 * invite link again. The page shows the same "check your inbox" either way,
 * so the form never reveals who is already on the list.
 */
export async function joinWithEmail(input: { name: string; email: string; phone: string; note?: string | null; locale: Locale; attribution: Attribution }) {
  const existing = await prisma.waitlistUser.findUnique({ where: { email: input.email } });

  if (!existing) {
    const user = await createMember({ ...input, provider: "email", verified: false });
    await sendVerification(user);
    return;
  }
  if (!existing.emailVerifiedAt) {
    const user = await prisma.waitlistUser.update({
      where: { id: existing.id },
      data: { name: input.name, phone: input.phone, locale: input.locale, ...(input.note ? { note: input.note } : {}) },
    });
    // Submitting again re-sends the link, but not more than once every few minutes.
    if (!sentRecently(existing.verifySentAt, RESEND_AFTER.VERIFY)) await sendVerification(user);
    return;
  }
  if (!existing.phone || input.note) {
    await prisma.waitlistUser.update({
      where: { id: existing.id },
      data: { ...(existing.phone ? {} : { phone: input.phone }), ...(input.note ? { note: input.note } : {}) },
    });
  }
  if (!sentRecently(existing.welcomeSentAt, RESEND_AFTER.WELCOME)) await sendWelcome(existing);
}

/** Mark a member confirmed (from the email link) and send the welcome email once. */
export async function confirmEmail(userId: string) {
  const user = await prisma.waitlistUser.findUnique({ where: { id: userId } });
  if (!user) return null;
  const confirmed = user.emailVerifiedAt
    ? user
    : await prisma.waitlistUser.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  if (!confirmed.welcomeSentAt) await sendWelcome(confirmed);
  return confirmed;
}

/** Called after Google sign-in: Google has already verified the email. */
export async function upsertGoogleMember(input: { name: string; email: string; locale: Locale; attribution: Attribution }) {
  const existing = await prisma.waitlistUser.findUnique({ where: { email: input.email } });
  if (existing) {
    if (!existing.emailVerifiedAt) {
      return prisma.waitlistUser.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date() } });
    }
    return existing;
  }
  return createMember({ ...input, provider: "google", verified: true });
}

/** Save a Google member's mobile number and send the welcome email if not sent yet. */
export async function completeGoogleMember(email: string, phone: string, note?: string | null) {
  const user = await prisma.waitlistUser.update({ where: { email }, data: { phone, ...(note ? { note } : {}) } });
  if (!user.welcomeSentAt) await sendWelcome(user);
  return user;
}

export async function countReferrals(userId: string) {
  return prisma.waitlistUser.count({ where: { referredById: userId, emailVerifiedAt: { not: null } } });
}

/** Stop all emails to a member (from the unsubscribe link). Returns false if the id is unknown. */
export async function unsubscribeMember(userId: string) {
  const res = await prisma.waitlistUser.updateMany({ where: { id: userId, unsubscribedAt: null }, data: { unsubscribedAt: new Date() } });
  if (res.count > 0) return true;
  return (await prisma.waitlistUser.count({ where: { id: userId } })) > 0;
}
