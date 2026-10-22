import { cookies } from "next/headers";
import { isValidAdminSession } from "./tokens";

export const ADMIN_COOKIE = "agyal_admin";

/** True when the request carries a valid admin cookie for the current ADMIN_PASSWORD. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return isValidAdminSession(jar.get(ADMIN_COOKIE)?.value, process.env.ADMIN_PASSWORD, process.env.AUTH_SECRET);
}
