import { z } from "zod";
import { normalizePhone } from "./phone";

const name = z.string().trim().min(2).max(120);
const email = z.string().trim().toLowerCase().email().max(200);

export const joinSchema = z
  .object({
    name,
    email,
    dial: z.string().trim(),
    phone: z.string().trim().min(5).max(30),
  })
  .transform((v, ctx) => {
    const phone = normalizePhone(v.dial, v.phone);
    if (!phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "phone" });
      return z.NEVER;
    }
    return { name: v.name, email: v.email, phone };
  });

export const phoneOnlySchema = z
  .object({ dial: z.string().trim(), phone: z.string().trim().min(5).max(30) })
  .transform((v, ctx) => {
    const phone = normalizePhone(v.dial, v.phone);
    if (!phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "phone" });
      return z.NEVER;
    }
    return phone;
  });

export const PARTNER_TYPES = ["BROKER", "BANK", "ASSET_MANAGER", "OTHER"] as const;

export const partnerSchema = z.object({
  institution: z.string().trim().min(2).max(160),
  type: z.enum(PARTNER_TYPES),
  name,
  role: z.string().trim().max(120).optional().transform((v) => v || null),
  email,
  phone: z.string().trim().max(40).optional().transform((v) => v || null),
  message: z.string().trim().max(2000).optional().transform((v) => v || null),
});

export const quoteSchema = z.object({
  currency: z.enum(["EGP", "USD", "EUR"]),
  instrument: z.enum(["TBILL", "BOND", "SUKUK", "EUROBOND", "CORP"]),
  labelEn: z.string().trim().min(1).max(80),
  labelAr: z.string().trim().min(1).max(80),
  tenorMonths: z.coerce.number().int().min(1).max(600),
  yieldPct: z.coerce.number().min(-5).max(100),
  couponsPerYear: z.coerce.number().int().min(0).max(12),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  asOf: z.coerce.date(),
});

/** The first field that failed, so forms can show one clear message. */
export function firstErrorField(error: z.ZodError): string {
  return String(error.issues[0]?.path[0] ?? "generic");
}
