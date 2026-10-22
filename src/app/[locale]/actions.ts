"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { partnerNotification } from "@/lib/email-templates";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/locale";
import { firstErrorField, joinSchema, partnerSchema, phoneOnlySchema } from "@/lib/validation";
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
  });
  const values = typed(formData, ["name", "email", "dial", "phone"]);
  if (!parsed.success) return { status: "error", field: firstErrorField(parsed.error), values };
  if (isBot(formData)) return { status: "sent", email: parsed.data.email };

  try {
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
    const locale = localeOf(formData);
    const request = await prisma.partnerRequest.create({ data: { ...parsed.data, locale } });
    const owner = process.env.OWNER_EMAIL;
    if (owner) {
      await sendEmail({ to: owner, replyTo: request.email, ...partnerNotification(request) }).catch((e) =>
        console.error("partner notification failed", e),
      );
    }
    return { status: "sent" };
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
  if (!parsed.success) return { status: "error", field: "phone", values: typed(formData, ["dial", "phone"]) };

  let code: string;
  try {
    const user = await completeGoogleMember(email, parsed.data);
    code = user.referralCode;
  } catch (e) {
    console.error("completeAction failed", e);
    return { status: "error", field: "generic", values: typed(formData, ["dial", "phone"]) };
  }
  redirect(`/${locale}/welcome/${code}`);
}
