import { randomInt } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { sendEmail } from "./email";
import { loginCodeEmail } from "./email-templates";
import { LOGIN_EMAIL_RESERVE, takeEmailBudget } from "./limits";
import { createMemberSession, hashLoginCode, loginCodeMatches, readMemberSession } from "./tokens";
import { confirmEmail } from "./waitlist";

export const MEMBER_COOKIE = "agyal-member";
const MINUTE = 60_000;
export const LOGIN_CODE_TTL = 10 * MINUTE;
export const LOGIN_RESEND_AFTER = MINUTE;
export const LOGIN_MAX_TRIES = 5;

type CodeState = { loginCodeHash: string | null; loginCodeExpiresAt: Date | null; loginCodeTries: number };
export type CodeCheck = "ok" | "wrong" | "expired" | "locked";

/** Pure check of a typed code against what's stored; the caller records tries. */
export function checkLoginCode(userId: string, code: string, state: CodeState, now = new Date(), key?: string): CodeCheck {
  if (!state.loginCodeHash || !state.loginCodeExpiresAt || state.loginCodeExpiresAt <= now) return "expired";
  if (state.loginCodeTries >= LOGIN_MAX_TRIES) return "locked";
  return /^\d{6}$/.test(code) && loginCodeMatches(userId, code, state.loginCodeHash, key) ? "ok" : "wrong";
}

export function canResendCode(sentAt: Date | null, now = new Date()): boolean {
  return !sentAt || now.getTime() - sentAt.getTime() >= LOGIN_RESEND_AFTER;
}

/**
 * Email a fresh code to a member. Unknown or unsubscribed emails get nothing,
 * and the page says the same either way, so it never reveals who is on the list.
 * "busy" means today's email budget (including the login reserve) is used up.
 */
export async function requestLoginCode(email: string): Promise<"sent" | "busy"> {
  const user = await prisma.waitlistUser.findUnique({ where: { email } });
  if (!user || user.unsubscribedAt || !canResendCode(user.loginCodeSentAt)) return "sent";
  if (!(await takeEmailBudget(LOGIN_EMAIL_RESERVE))) return "busy";

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  await prisma.waitlistUser.update({
    where: { id: user.id },
    data: { loginCodeHash: hashLoginCode(user.id, code), loginCodeExpiresAt: new Date(now.getTime() + LOGIN_CODE_TTL), loginCodeSentAt: now, loginCodeTries: 0 },
  });
  try {
    await sendEmail({ to: user.email, ...loginCodeEmail(user.name.split(" ")[0], code) });
  } catch (e) {
    console.error(`Sending login code failed for ${user.id}`, e);
    await prisma.waitlistUser.update({ where: { id: user.id }, data: { loginCodeSentAt: null } });
    return "busy";
  }
  return "sent";
}

/** Check a typed code. On success the code is used up and the member is confirmed (the code proves the email is theirs). */
export async function verifyLoginCode(email: string, code: string): Promise<{ result: CodeCheck; userId?: string }> {
  const user = await prisma.waitlistUser.findUnique({ where: { email } });
  if (!user) return { result: "expired" };
  const result = checkLoginCode(user.id, code, user);
  if (result === "wrong") {
    await prisma.waitlistUser.update({ where: { id: user.id }, data: { loginCodeTries: { increment: 1 } } });
    return { result: user.loginCodeTries + 1 >= LOGIN_MAX_TRIES ? "locked" : "wrong" };
  }
  if (result !== "ok") return { result };
  await prisma.waitlistUser.update({
    where: { id: user.id },
    data: { loginCodeHash: null, loginCodeExpiresAt: null, loginCodeTries: 0, lastLoginAt: new Date() },
  });
  if (!user.emailVerifiedAt) await confirmEmail(user.id);
  return { result, userId: user.id };
}

export async function startMemberSession(userId: string) {
  (await cookies()).set(MEMBER_COOKIE, createMemberSession(userId), {
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function endMemberSession() {
  (await cookies()).delete(MEMBER_COOKIE);
}

/** The logged-in member, or null. */
export async function currentMember() {
  const userId = readMemberSession((await cookies()).get(MEMBER_COOKIE)?.value);
  return userId ? prisma.waitlistUser.findUnique({ where: { id: userId } }) : null;
}
