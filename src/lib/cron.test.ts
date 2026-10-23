import { describe, expect, it } from "vitest";
import { cronAuthorized } from "./cron";

describe("cron auth", () => {
  it("accepts only the exact bearer secret", () => {
    expect(cronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(cronAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(cronAuthorized(null, "s3cret")).toBe(false);
  });
  it("refuses everything when no secret is configured", () => {
    expect(cronAuthorized("Bearer ", "")).toBe(false);
    expect(cronAuthorized("Bearer undefined", undefined)).toBe(false);
  });
});
