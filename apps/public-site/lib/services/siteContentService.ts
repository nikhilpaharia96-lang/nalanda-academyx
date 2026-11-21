import { cache } from "react";
import { buildLocalSiteContent, type SiteContent } from "@/lib/content/siteContent";
import { API_BASE_URL, USE_MOCK_DATA } from "@/lib/services/apiClient";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Local defaults filled with the API's saved content: objects merge key by key, lists are taken whole. */
function deepFill<T>(def: T, over: unknown): T {
  if (over === undefined || over === null) return def;
  if (Array.isArray(def)) return (Array.isArray(over) ? over : def) as T;
  if (isObj(def)) {
    if (!isObj(over)) return def;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(def)) out[k] = deepFill((def as Record<string, unknown>)[k], over[k]);
    return out as T;
  }
  return (typeof over === typeof def ? over : def) as T;
}

/**
 * The site's editable content. With NEXT_PUBLIC_API_URL set this is whatever
 * admins saved under Admin → Website Content (revalidated every 30s); with it
 * unset, or if the API is down, the built-in content in lib/content/*.ts.
 * Wrapped in React `cache` so one render fetches it once.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const local = buildLocalSiteContent();
  if (USE_MOCK_DATA) return local;
  try {
    const res = await fetch(`${API_BASE_URL}/api/site-content`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const remote = (await res.json()) as Record<string, unknown>;
    const merged = deepFill(local, remote);
    // Values that come from env vars locally keep working if the admin leaves them blank.
    if (!merged.contact.mapEmbedUrl) merged.contact.mapEmbedUrl = local.contact.mapEmbedUrl;
    for (const k of ["instagram", "facebook", "youtube"] as const) if (!merged.social[k]) merged.social[k] = local.social[k];
    return merged;
  } catch (err) {
    console.error("[siteContent] using built-in content:", err);
    return local;
  }
});
