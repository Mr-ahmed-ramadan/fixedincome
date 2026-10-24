import { describe, expect, it } from "vitest";
import { canResendCode, checkLoginCode, LOGIN_MAX_TRIES } from "./member";
import { createMemberSession, hashLoginCode, readMemberSession } from "./tokens";
import { loginCodeEmail } from "./email-templates";
import { nextTheme } from "@/components/theme-toggle";

const KEY = "test-secret";
const now = new Date("2026-10-24T10:00:00Z");
const state = (over: Partial<{ loginCodeHash: string | null; loginCodeExpiresAt: Date | null; loginCodeTries: number }> = {}) => ({
  loginCodeHash: hashLoginCode("u1", "123456", KEY),
  loginCodeExpiresAt: new Date(now.getTime() + 5 * 60_000),
  loginCodeTries: 0,
  ...over,
});

describe("login codes", () => {
  it("accepts the right code", () => {
    expect(checkLoginCode("u1", "123456", state(), now, KEY)).toBe("ok");
  });
  it("rejects a wrong code, or the right code for someone else", () => {
    expect(checkLoginCode("u1", "123457", state(), now, KEY)).toBe("wrong");
    expect(checkLoginCode("u2", "123456", state(), now, KEY)).toBe("wrong");
    expect(checkLoginCode("u1", "12345", state(), now, KEY)).toBe("wrong");
  });
  it("expires after its time, or once used", () => {
    expect(checkLoginCode("u1", "123456", state({ loginCodeExpiresAt: new Date(now.getTime() - 1) }), now, KEY)).toBe("expired");
    expect(checkLoginCode("u1", "123456", state({ loginCodeHash: null }), now, KEY)).toBe("expired");
  });
  it(`locks after ${LOGIN_MAX_TRIES} wrong tries, even for the right code`, () => {
    expect(checkLoginCode("u1", "123456", state({ loginCodeTries: LOGIN_MAX_TRIES }), now, KEY)).toBe("locked");
  });
  it("allows a new code only after a minute", () => {
    expect(canResendCode(null, now)).toBe(true);
    expect(canResendCode(new Date(now.getTime() - 30_000), now)).toBe(false);
    expect(canResendCode(new Date(now.getTime() - 60_000), now)).toBe(true);
  });
});

describe("member session cookie", () => {
  it("round-trips, expires after 30 days and rejects tampering", () => {
    const v = createMemberSession("u1", now.getTime(), KEY);
    expect(readMemberSession(v, now.getTime(), KEY)).toBe("u1");
    expect(readMemberSession(v, now.getTime() + 31 * 24 * 3600_000, KEY)).toBeNull();
    expect(readMemberSession(v.replace("u1", "u2"), now.getTime(), KEY)).toBeNull();
    expect(readMemberSession(v, now.getTime(), "other-key")).toBeNull();
  });
});

describe("login code email", () => {
  it("has the code and both languages, English first", () => {
    const m = loginCodeEmail("Amina", "042917");
    expect(m.subject).toBe("Your AGYAL login code: 042917 | رمز الدخول إلى أجيال");
    expect(m.html).toContain("042917");
    expect(m.text.indexOf("Here is your code")).toBeLessThan(m.text.indexOf("هذا رمز الدخول"));
  });
});

describe("theme switch", () => {
  it("flips with one click", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});
