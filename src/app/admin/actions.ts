"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { adminSessionValue, checkPassword } from "@/lib/tokens";
import { CHANNEL_STATUSES, TASK_STATUSES, channelSchema, nextStatus, quoteSchema, taskSchema, taskUpdateSchema } from "@/lib/validation";

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

// --- Marketing plan
const toMarketing = () => redirect("/admin?tab=marketing");

export async function cycleTaskStatus(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id"));
  const task = await prisma.marketingTask.findUnique({ where: { id } });
  if (task) await prisma.marketingTask.update({ where: { id }, data: { status: nextStatus(TASK_STATUSES, task.status) } });
  toMarketing();
}

export async function updateTask(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const parsed = taskUpdateSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) await prisma.marketingTask.update({ where: { id: String(formData.get("id")) }, data: parsed.data });
  toMarketing();
}

export async function addTask(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin?tab=marketing&error=task");
  const last = await prisma.marketingTask.aggregate({ _max: { sortOrder: true } });
  await prisma.marketingTask.create({ data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  toMarketing();
}

export async function deleteTask(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await prisma.marketingTask.delete({ where: { id: String(formData.get("id")) } });
  toMarketing();
}

export async function cycleChannelStatus(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const key = String(formData.get("key"));
  const ch = await prisma.marketingChannel.findUnique({ where: { key } });
  if (ch) await prisma.marketingChannel.update({ where: { key }, data: { status: nextStatus(CHANNEL_STATUSES, ch.status) } });
  toMarketing();
}

export async function updateChannel(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const parsed = channelSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) await prisma.marketingChannel.update({ where: { key: String(formData.get("key")) }, data: parsed.data });
  toMarketing();
}
