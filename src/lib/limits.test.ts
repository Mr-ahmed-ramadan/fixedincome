import { afterEach, describe, expect, it } from "vitest";
import { RESEND_AFTER, emailDailyCap, keys, sentRecently } from "./limits";

describe("email throttle", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  it("doesn't re-send a confirmation within 10 minutes", () => {
    expect(sentRecently(new Date("2026-10-23T11:55:00Z"), RESEND_AFTER.VERIFY, now)).toBe(true);
    expect(sentRecently(new Date("2026-10-23T11:49:00Z"), RESEND_AFTER.VERIFY, now)).toBe(false);
    expect(sentRecently(null, RESEND_AFTER.VERIFY, now)).toBe(false);
  });
  it("re-sends a welcome at most hourly", () => {
    expect(sentRecently(new Date("2026-10-23T11:30:00Z"), RESEND_AFTER.WELCOME, now)).toBe(true);
    expect(sentRecently(new Date("2026-10-23T10:59:00Z"), RESEND_AFTER.WELCOME, now)).toBe(false);
  });
});

describe("daily email cap", () => {
  const saved = process.env.EMAIL_DAILY_CAP;
  afterEach(() => {
    process.env.EMAIL_DAILY_CAP = saved;
  });
  it("defaults under Resend's free 100/day and follows EMAIL_DAILY_CAP", () => {
    delete process.env.EMAIL_DAILY_CAP;
    expect(emailDailyCap()).toBe(90);
    process.env.EMAIL_DAILY_CAP = "1500";
    expect(emailDailyCap()).toBe(1500);
    process.env.EMAIL_DAILY_CAP = "nonsense";
    expect(emailDailyCap()).toBe(90);
  });
  it("keys counters by UTC day and form", () => {
    expect(keys.emailToday()).toMatch(/^email:\d{4}-\d{2}-\d{2}$/);
    expect(keys.ip("join", "1.2.3.4")).toBe("join:ip:1.2.3.4");
  });
});
