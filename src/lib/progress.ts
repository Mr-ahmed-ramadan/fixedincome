import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "./locale";
import { prisma } from "./db";

/**
 * Where AGYAL is on the "Where we are" timeline, set in /admin → Overview.
 * The step key was renamed when "Platform built" became the first step, so an index saved for the old list is ignored.
 */
export const PROGRESS_KEYS = { step: "progress-stage", noteEn: "progress-note-en", noteAr: "progress-note-ar" } as const;

export type Progress = { step: number; note: Record<Locale, string> };

export const STEP_COUNT = getDictionary("en").timeline.steps.length;

export function clampStep(n: number): number {
  return Number.isInteger(n) ? Math.min(Math.max(n, 0), STEP_COUNT - 1) : getDictionary("en").timeline.current;
}

/** Current step and optional "latest update" text; falls back to the wording file if nothing is saved. */
export async function currentProgress(): Promise<Progress> {
  const rows = await prisma.appMeta.findMany({ where: { key: { in: Object.values(PROGRESS_KEYS) } } });
  const get = (k: string) => rows.find((r) => r.key === k)?.value ?? "";
  const saved = get(PROGRESS_KEYS.step);
  return {
    step: clampStep(saved === "" ? NaN : Number(saved)),
    note: { en: get(PROGRESS_KEYS.noteEn), ar: get(PROGRESS_KEYS.noteAr) },
  };
}
