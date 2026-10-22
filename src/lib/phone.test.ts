import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("handles the ways Egyptians type mobile numbers", () => {
    expect(normalizePhone("20", "01001234567")).toBe("+201001234567");
    expect(normalizePhone("20", "1001234567")).toBe("+201001234567");
    expect(normalizePhone("20", "010 0123 4567")).toBe("+201001234567");
    expect(normalizePhone("20", "+20 100 123 4567")).toBe("+201001234567");
    expect(normalizePhone("20", "00201001234567")).toBe("+201001234567");
    expect(normalizePhone("20", "٠١٠٠١٢٣٤٥٦٧")).toBe("+201001234567");
  });

  it("rejects numbers that aren't Egyptian mobiles", () => {
    expect(normalizePhone("20", "0223456789")).toBeNull(); // Cairo landline
    expect(normalizePhone("20", "0101234")).toBeNull();
    expect(normalizePhone("20", "abc")).toBeNull();
  });

  it("accepts other countries and unknown-prefix international numbers", () => {
    expect(normalizePhone("966", "0501234567")).toBe("+966501234567");
    expect(normalizePhone("44", "07700 900123")).toBe("+447700900123");
    expect(normalizePhone("20", "+971501234567")).toBe("+971501234567");
  });

  it("rejects dial codes we don't offer", () => {
    expect(normalizePhone("999", "123456789")).toBeNull();
  });
});
