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
