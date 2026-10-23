"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { partnerAckEmail } from "@/lib/email-templates";
import { CAL_URL } from "@/lib/site";
import { allowFormSubmit, takeEmailBudget } from "@/lib/limits";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/locale";
import { firstErrorField, joinSchema, note as noteSchema, partnerSchema, phoneOnlySchema } from "@/lib/validation";
import { completeGoogleMember, joinWithEmail } from "@/lib/waitlist";

export type FormState = {
  status: "idle" | "sent" | "error";
  field?: string;
  email?: string;
  /** What the person typed, so a failed submit doesn't wipe the form. */
  values?: Record<string, string>;
};

function typed(formData: FormData, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

function localeOf(formData: FormData): Locale {
  const v = formData.get("locale");
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** The visitor's network address (Vercel puts the real one first). */
async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** Bots fill every field; people never see this one. */
function isBot(formData: FormData) {
  return String(formData.get("website") ?? "").length > 0;
}

export async function joinAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    dial: formData.get("dial"),
    phone: formData.get("phone"),
    note: formData.get("note"),
  });
  const values = typed(formData, ["name", "email", "dial", "phone", "note"]);
  if (!parsed.success) return { status: "error", field: firstErrorField(parsed.error), values };
  if (isBot(formData)) return { status: "sent", email: parsed.data.email };

  try {
    if (!(await allowFormSubmit("join", await clientIp()))) return { status: "error", field: "rate", values };
    const jar = await cookies();
    await joinWithEmail({
      ...parsed.data,
      locale: localeOf(formData),
      attribution: parseAttribution(jar.get(ATTRIBUTION_COOKIE)?.value),
    });
    return { status: "sent", email: parsed.data.email };
  } catch (e) {
    console.error("joinAction failed", e);
    return { status: "error", field: "generic", values };
  }
}

export async function partnerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = partnerSchema.safeParse({
    institution: formData.get("institution"),
    type: formData.get("type"),
    name: formData.get("name"),
    role: formData.get("role") ?? undefined,
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    message: formData.get("message") ?? undefined,
  });
  const values = typed(formData, ["institution", "type", "name", "role", "email", "phone", "message"]);
  if (!parsed.success) return { status: "error", field: firstErrorField(parsed.error), values };
  if (isBot(formData)) return { status: "sent" };

  try {
    if (!(await allowFormSubmit("partner", await clientIp()))) return { status: "error", field: "rate", values };
    const locale = localeOf(formData);
    // Saved for the admin panel; the partner gets an acknowledgement (nothing is forwarded anywhere).
    const request = await prisma.partnerRequest.create({ data: { ...parsed.data, locale } });
    // The request is what matters; the acknowledgement is skipped if today's email budget is used up.
    if (await takeEmailBudget()) {
      await sendEmail({ to: request.email, ...partnerAckEmail(locale, request.name, request.institution, CAL_URL) }).catch((e) =>
        console.error("partner acknowledgement failed", e),
      );
    }
    return { status: "sent", email: request.email };
  } catch (e) {
    console.error("partnerAction failed", e);
    return { status: "error", field: "generic", values };
  }
}

export async function googleAction(formData: FormData) {
  const locale = localeOf(formData);
  await signIn("google", { redirectTo: `/${locale}/join/complete` });
}

export async function completeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = localeOf(formData);
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect(`/${locale}#join`);

  const parsed = phoneOnlySchema.safeParse({ dial: formData.get("dial"), phone: formData.get("phone") });
  if (!parsed.success) return { status: "error", field: "phone", values: typed(formData, ["dial", "phone", "note"]) };
  const note = noteSchema.parse(formData.get("note"));

  let code: string;
  try {
    const user = await completeGoogleMember(email, parsed.data, note);
    code = user.referralCode;
  } catch (e) {
    console.error("completeAction failed", e);
    return { status: "error", field: "generic", values: typed(formData, ["dial", "phone", "note"]) };
  }
  redirect(`/${locale}/welcome/${code}`);
}
