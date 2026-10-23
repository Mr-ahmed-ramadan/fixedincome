import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { APP_URL } from "@/lib/site";

// Rebuilt at most hourly so new securities appear without a deploy.
export const revalidate = 3600;

/** Every public page in both languages, with each page's Arabic/English pair. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ids = await prisma.yieldQuote
    .findMany({ where: { active: true }, select: { id: true } })
    .then((rows) => rows.map((r) => r.id))
    .catch(() => [] as string[]);
  const paths = ["", "/privacy", "/terms", ...ids.map((id) => `/securities/${id}`)];
  return paths.flatMap((path) =>
    (["ar", "en"] as const).map((locale) => ({
      url: `${APP_URL}/${locale}${path}`,
      changeFrequency: path === "" || path.startsWith("/securities") ? ("daily" as const) : ("yearly" as const),
      priority: path === "" ? 1 : path.startsWith("/securities") ? 0.7 : 0.3,
      alternates: { languages: { ar: `${APP_URL}/ar${path}`, en: `${APP_URL}/en${path}` } },
    })),
  );
}
