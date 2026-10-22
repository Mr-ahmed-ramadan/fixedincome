import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { sendEmail } from "./email";
import { verifyEmail, welcomeEmail } from "./email-templates";
import { generateReferralCode } from "./referral";
import { createVerifyToken } from "./tokens";
import { APP_URL, inviteUrl } from "./site";
import type { Attribution } from "./attribution";
import { isLocale, type Locale } from "./locale";

type NewMember = {
  name: string;
  email: string;
  phone?: string | null;
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

export async function sendVerification(user: { id: string; name: string; email: string; locale: string }) {
  const locale = memberLocale(user.locale);
  const link = `${APP_URL}/${locale}/verify?token=${encodeURIComponent(createVerifyToken(user.id))}`;
  await sendEmail({ to: user.email, ...verifyEmail(locale, user.name, link) });
}

export async function sendWelcome(user: { id: string; name: string; email: string; locale: string; referralCode: string }) {
  const locale = memberLocale(user.locale);
  await sendEmail({ to: user.email, ...welcomeEmail(locale, user.name, inviteUrl(locale, user.referralCode)) });
  await prisma.waitlistUser.update({ where: { id: user.id }, data: { welcomeSentAt: new Date() } });
}

/**
 * Handle the email form. New people get a confirmation link; people who joined
 * before but never confirmed get a fresh link; confirmed members get their
 * invite link again. The page shows the same "check your inbox" either way,
 * so the form never reveals who is already on the list.
 */
export async function joinWithEmail(input: { name: string; email: string; phone: string; locale: Locale; attribution: Attribution }) {
  const existing = await prisma.waitlistUser.findUnique({ where: { email: input.email } });

  if (!existing) {
    const user = await createMember({ ...input, provider: "email", verified: false });
    await sendVerification(user);
    return;
  }
  if (!existing.emailVerifiedAt) {
    const user = await prisma.waitlistUser.update({
      where: { id: existing.id },
      data: { name: input.name, phone: input.phone, locale: input.locale },
    });
    await sendVerification(user);
    return;
  }
  if (!existing.phone) {
    await prisma.waitlistUser.update({ where: { id: existing.id }, data: { phone: input.phone } });
  }
  await sendWelcome(existing);
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
export async function completeGoogleMember(email: string, phone: string) {
  const user = await prisma.waitlistUser.update({ where: { email }, data: { phone } });
  if (!user.welcomeSentAt) await sendWelcome(user);
  return user;
}

export async function countReferrals(userId: string) {
  return prisma.waitlistUser.count({ where: { referredById: userId, emailVerifiedAt: { not: null } } });
}
