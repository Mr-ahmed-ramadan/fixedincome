import { normalizeReferralCode } from "./referral";

/** Cookie holding where a visitor came from (invite code + UTM tags). */
export const ATTRIBUTION_COOKIE = "agyal_attr";
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 30;

export type Attribution = {
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
};

const UTM_PARAMS: [keyof Attribution, string][] = [
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmContent", "utm_content"],
];

function clean(v: string | null): string | undefined {
  const s = v?.trim().slice(0, 100);
  return s ? s : undefined;
}

/**
 * Merge attribution found in a URL's query into what we already know.
 * The first invite code wins (so the friend who shared first gets credit);
 * UTM tags reflect the latest campaign link. Returns null when nothing changed.
 */
export function mergeAttribution(existing: Attribution, params: URLSearchParams): Attribution | null {
  const next: Attribution = { ...existing };
  let changed = false;

  const ref = normalizeReferralCode(params.get("ref"));
  if (ref && !existing.ref) {
    next.ref = ref;
    changed = true;
  }
  for (const [key, param] of UTM_PARAMS) {
    const v = clean(params.get(param));
    if (v && v !== existing[key]) {
      next[key] = v;
      changed = true;
    }
  }
  return changed ? next : null;
}

export function parseAttribution(raw: string | undefined): Attribution {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return {};
    const out: Attribution = {};
    const ref = normalizeReferralCode(v.ref);
    if (ref) out.ref = ref;
    for (const [key] of UTM_PARAMS) if (typeof v[key] === "string") out[key] = v[key].slice(0, 100);
    return out;
  } catch {
    return {};
  }
}
