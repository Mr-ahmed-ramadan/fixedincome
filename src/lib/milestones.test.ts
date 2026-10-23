import { describe, expect, it } from "vitest";
import { milestones, statusOf, type Metrics } from "./milestones";

const base: Metrics = {
  emailsToday: 0,
  emailsThisMonth: 0,
  emailDailyCap: 90,
  pendingEmails: 0,
  signupsThisMonth: 0,
  signupsTotal: 0,
  partnerRequests: 0,
  blockedToday: 0,
  calUrlSet: false,
  googleSignInSet: false,
};
const get = (m: Metrics, id: string) => milestones(m).find((x) => x.id === id)!;

describe("milestones", () => {
  it("is fine below 70%, coming up from 70%, action needed at the limit", () => {
    expect(statusOf({ value: 60, limit: 100 })).toBe("ok");
    expect(statusOf({ value: 70, limit: 100 })).toBe("soon");
    expect(statusOf({ value: 100, limit: 100 })).toBe("hit");
  });

  it("flags the Resend upgrade when today's cap is reached or emails are queued", () => {
    expect(statusOf(get({ ...base, emailsToday: 90 }, "resend-daily"))).toBe("hit");
    expect(statusOf(get({ ...base, emailsToday: 3, pendingEmails: 2 }, "resend-daily"))).toBe("hit");
    expect(statusOf(get({ ...base, emailsToday: 20 }, "resend-daily"))).toBe("ok");
  });

  it("switches to the paid-plan limit once EMAIL_DAILY_CAP is raised", () => {
    const paid = milestones({ ...base, emailDailyCap: 1500, emailsThisMonth: 40000 });
    expect(paid.find((m) => m.id === "resend-daily")).toBeUndefined();
    expect(statusOf(paid.find((m) => m.id === "resend-pro-monthly")!)).toBe("soon");
  });

  it("asks for a booking link only once partners write and none is set", () => {
    expect(statusOf(get({ ...base, partnerRequests: 1 }, "booking-link"))).toBe("hit");
    expect(statusOf(get({ ...base, partnerRequests: 4, calUrlSet: true }, "booking-link"))).toBe("ok");
  });

  it("watches database load by sign-ups this month", () => {
    expect(statusOf(get({ ...base, signupsThisMonth: 7500 }, "database"))).toBe("soon");
  });
});
