import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(payload: string, key = secret()): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** A signed, expiring email-verification token: `<userId>.<expiry>.<signature>`. */
export function createVerifyToken(userId: string, now = Date.now(), ttlSeconds = DEFAULT_TTL_SECONDS, key?: string): string {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(`verify:${payload}`, key)}`;
}

/** Returns the user id if the token is genuine and not expired, otherwise null. */
export function readVerifyToken(token: string | null | undefined, now = Date.now(), key?: string): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!userId || !Number.isFinite(exp)) return null;
  if (!safeEqual(sig, sign(`verify:${userId}.${expRaw}`, key))) return null;
  if (exp * 1000 < now) return null;
  return userId;
}

/** A permanent unsubscribe token for email links: `<userId>.<signature>`. */
export function createUnsubscribeToken(userId: string, key?: string): string {
  return `${userId}.${sign(`unsub:${userId}`, key)}`;
}

export function readUnsubscribeToken(token: string | null | undefined, key?: string): string | null {
  if (!token) return null;
  const [userId, sig, extra] = token.split(".");
  if (!userId || !sig || extra !== undefined) return null;
  return safeEqual(sig, sign(`unsub:${userId}`, key)) ? userId : null;
}

/** Value stored in the admin cookie; changes whenever the admin password changes. */
export function adminSessionValue(password: string, key?: string): string {
  return sign(`admin:${password}`, key);
}

export function isValidAdminSession(cookieValue: string | undefined, password: string | undefined, key?: string): boolean {
  if (!cookieValue || !password) return false;
  return safeEqual(cookieValue, adminSessionValue(password, key));
}

export function checkPassword(given: string, expected: string | undefined): boolean {
  if (!expected) return false;
  // Compare hashes so lengths always match.
  return safeEqual(sign(`pw:${given}`, "agyal"), sign(`pw:${expected}`, "agyal"));
}

const MEMBER_SESSION_SECONDS = 30 * 24 * 60 * 60;

/** Value of the member login cookie: `<userId>.<expiry>.<signature>`, valid 30 days. */
export function createMemberSession(userId: string, now = Date.now(), key?: string): string {
  const payload = `${userId}.${Math.floor(now / 1000) + MEMBER_SESSION_SECONDS}`;
  return `${payload}.${sign(`member:${payload}`, key)}`;
}

export function readMemberSession(value: string | null | undefined, now = Date.now(), key?: string): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!userId || !Number.isFinite(exp)) return null;
  if (!safeEqual(sig, sign(`member:${userId}.${expRaw}`, key))) return null;
  if (exp * 1000 < now) return null;
  return userId;
}

/** Stored instead of a login code, so a database leak doesn't reveal live codes. */
export function hashLoginCode(userId: string, code: string, key?: string): string {
  return sign(`login:${userId}:${code}`, key);
}

export function loginCodeMatches(userId: string, code: string, hash: string, key?: string): boolean {
  return safeEqual(hashLoginCode(userId, code, key), hash);
}
