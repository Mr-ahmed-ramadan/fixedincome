"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { adminSessionValue, checkPassword } from "@/lib/tokens";
import { quoteSchema } from "@/lib/validation";

export async function login(formData: FormData) {
  const password = process.env.ADMIN_PASSWORD;
  if (!checkPassword(String(formData.get("password") ?? ""), password)) redirect("/admin?error=1");
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, adminSessionValue(password!, process.env.AUTH_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}

function refreshSite() {
  revalidatePath("/ar");
  revalidatePath("/en");
}

export async function saveQuote(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin?tab=yields&error=${encodeURIComponent(parsed.error.issues[0]?.path.join(".") ?? "form")}`);
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.yieldQuote.update({ where: { id }, data: parsed.data });
  else await prisma.yieldQuote.create({ data: parsed.data });
  refreshSite();
  redirect("/admin?tab=yields&saved=1");
}

export async function deleteQuote(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await prisma.yieldQuote.delete({ where: { id: String(formData.get("id")) } });
  refreshSite();
  redirect("/admin?tab=yields");
}
