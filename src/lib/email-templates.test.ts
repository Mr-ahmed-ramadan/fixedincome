import { describe, expect, it } from "vitest";
import { partnerAckEmail, verifyEmail, welcomeEmail } from "./email-templates";

const before = (s: string, a: string, b: string) => s.indexOf(a) > -1 && s.indexOf(b) > s.indexOf(a);

describe("emails carry English first, then Arabic", () => {
  it("confirmation email", () => {
    const m = verifyEmail("ar", "Amina", "https://agyal.net/ar/verify?token=abc");
    expect(m.subject).toBe("Confirm your place on the AGYAL waitlist | أكّد مكانك في قائمة انتظار أجيال");
    expect(before(m.html, "Confirm my email", 'dir="rtl"')).toBe(true);
    expect(before(m.text, "Thanks for joining", "العربية")).toBe(true);
    // the link still opens the page in the language the person signed up in
    expect(m.html).toContain("https://agyal.net/ar/verify?token=abc");
    expect(m.html.match(/ar\/verify\?token=abc/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("welcome email has both timelines and one unsubscribe link", () => {
    const m = welcomeEmail("en", "Amina", "https://agyal.net/en?ref=X", "https://agyal.net/en/unsubscribe?t=1");
    expect(before(m.html, "Egyptian T-bills", "أذون الخزانة")).toBe(true);
    expect(m.html).toContain("Unsubscribe · إلغاء الاشتراك");
    expect(m.html.split("unsubscribe?t=1").length - 1).toBe(1);
  });

  it("partner acknowledgement", () => {
    const m = partnerAckEmail("en", "Omar", "Acme Securities", "");
    expect(before(m.text, "founding partner", "شريك")).toBe(true);
    expect(m.html.split("Acme Securities").length - 1).toBe(2);
  });
});
