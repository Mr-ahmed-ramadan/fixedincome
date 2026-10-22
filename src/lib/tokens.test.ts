import { describe, expect, it } from "vitest";
import { adminSessionValue, checkPassword, createVerifyToken, isValidAdminSession, readVerifyToken } from "./tokens";

const KEY = "test-secret";

describe("verification tokens", () => {
  it("round-trips the user id", () => {
    const token = createVerifyToken("user_123", Date.now(), 60, KEY);
    expect(readVerifyToken(token, Date.now(), KEY)).toBe("user_123");
  });

  it("rejects expired tokens", () => {
    const issued = Date.UTC(2026, 0, 1);
    const token = createVerifyToken("u1", issued, 60, KEY);
    expect(readVerifyToken(token, issued + 61_000, KEY)).toBeNull();
  });

  it("rejects tampered or foreign tokens", () => {
    const token = createVerifyToken("u1", Date.now(), 60, KEY);
    const [, exp, sig] = token.split(".");
    expect(readVerifyToken(`u2.${exp}.${sig}`, Date.now(), KEY)).toBeNull();
    expect(readVerifyToken(token, Date.now(), "other-secret")).toBeNull();
    expect(readVerifyToken("garbage", Date.now(), KEY)).toBeNull();
    expect(readVerifyToken(undefined, Date.now(), KEY)).toBeNull();
  });
});

describe("admin session", () => {
  it("accepts the cookie for the current password only", () => {
    const cookie = adminSessionValue("pw1", KEY);
    expect(isValidAdminSession(cookie, "pw1", KEY)).toBe(true);
    expect(isValidAdminSession(cookie, "pw2", KEY)).toBe(false);
    expect(isValidAdminSession(undefined, "pw1", KEY)).toBe(false);
    expect(isValidAdminSession(cookie, undefined, KEY)).toBe(false);
  });

  it("checks passwords and refuses when none is configured", () => {
    expect(checkPassword("secret", "secret")).toBe(true);
    expect(checkPassword("secret", "Secret")).toBe(false);
    expect(checkPassword("", undefined)).toBe(false);
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips and rejects tampering", async () => {
    const { createUnsubscribeToken, readUnsubscribeToken } = await import("./tokens");
    const token = createUnsubscribeToken("user_9", KEY);
    expect(readUnsubscribeToken(token, KEY)).toBe("user_9");
    expect(readUnsubscribeToken(token.replace("user_9", "user_8"), KEY)).toBeNull();
    expect(readUnsubscribeToken(`${token}.x`, KEY)).toBeNull();
    expect(readUnsubscribeToken(token, "other")).toBeNull();
  });
});
