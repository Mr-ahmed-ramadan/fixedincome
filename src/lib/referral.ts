// No 0/O/1/I/L so codes are easy to read aloud and type.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERRAL_CODE_LENGTH = 7;

/** Random invite code. Uses Web Crypto so it also runs in middleware (edge). */
export function generateReferralCode(length = REFERRAL_CODE_LENGTH): string {
  const limit = 256 - (256 % ALPHABET.length); // reject bytes that would bias the pick
  let code = "";
  while (code.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const b of bytes) {
      if (b < limit && code.length < length) code += ALPHABET[b % ALPHABET.length];
    }
  }
  return code;
}

export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  if (code.length !== REFERRAL_CODE_LENGTH) return null;
  for (const ch of code) if (!ALPHABET.includes(ch)) return null;
  return code;
}
