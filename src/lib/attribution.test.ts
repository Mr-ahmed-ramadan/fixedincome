import { describe, expect, it } from "vitest";
import { mergeAttribution, parseAttribution } from "./attribution";
import { generateReferralCode, normalizeReferralCode, REFERRAL_CODE_LENGTH } from "./referral";

describe("referral codes", () => {
  it("generates readable codes that normalize back", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(REFERRAL_CODE_LENGTH);
      expect(code).not.toMatch(/[01OIL]/);
      expect(normalizeReferralCode(code.toLowerCase())).toBe(code);
    }
  });

  it("rejects malformed codes", () => {
    expect(normalizeReferralCode("ABC")).toBeNull();
    expect(normalizeReferralCode("ABCDEF0")).toBeNull();
    expect(normalizeReferralCode(42)).toBeNull();
  });
});

describe("attribution", () => {
  it("keeps the first invite code and the latest campaign", () => {
    const first = mergeAttribution({}, new URLSearchParams("ref=abcdefg&utm_source=instagram"));
    expect(first).toEqual({ ref: "ABCDEFG", utmSource: "instagram" });

    const second = mergeAttribution(first!, new URLSearchParams("ref=HJKMNPQ&utm_source=linkedin"));
    expect(second).toEqual({ ref: "ABCDEFG", utmSource: "linkedin" });
  });

  it("returns null when the URL adds nothing", () => {
    expect(mergeAttribution({ utmSource: "x" }, new URLSearchParams("utm_source=x"))).toBeNull();
    expect(mergeAttribution({}, new URLSearchParams("ref=bad"))).toBeNull();
  });

  it("parses the cookie defensively", () => {
    expect(parseAttribution(undefined)).toEqual({});
    expect(parseAttribution("{not json")).toEqual({});
    expect(parseAttribution(JSON.stringify({ ref: "abcdefg", utmSource: "tiktok", evil: 1 }))).toEqual({ ref: "ABCDEFG", utmSource: "tiktok" });
  });
});
