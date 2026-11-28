// Pure helpers (no DB, no Nest) for the website-content CMS: merging saved
// overrides onto the built-in defaults, and validating an admin's edit
// against the *shape* of those defaults so a bad save can never break the
// public site.

export const MAX_STRING = 5000;
export const MAX_ARRAY = 100;

export interface SectionMeta { key: string; label: string; description: string }

export const SECTION_META: SectionMeta[] = [
  { key: "site", label: "Site identity & logo", description: "School name, tagline, description, logo and the Admission button label." },
  { key: "theme", label: "Brand colours", description: "The colour palette used across the whole public website." },
  { key: "contact", label: "Contact details", description: "Address, phone, email, office hours and map embed link (used in the top bar, footer and contact page)." },
  { key: "social", label: "Social media links", description: "Full URLs. Empty ones are simply not shown." },
  { key: "navigation", label: "Menus", description: "Main navigation links and the footer 'Explore' links." },
  { key: "homepage", label: "Homepage layout", description: "Show, hide and reorder the blocks on the homepage." },
  { key: "hero", label: "Homepage hero banner", description: "Headline copy, quotes, feature cards and the background photo carousel." },
  { key: "about", label: "About & principal's message", description: "About preview, vision & mission, gallery, school story, values, milestones and the principal's message." },
  { key: "academics", label: "Academics", description: "Programmes, learning approach, support and academic highlights." },
  { key: "facilities", label: "Campus & facilities", description: "Campus page copy, highlights, facility showcase and image feature." },
  { key: "faculty", label: "Faculty page copy", description: "Headings, philosophy, values and call-to-action on the Faculty page (staff profiles are managed under Teachers/Faculty)." },
  { key: "events", label: "Events page copy", description: "Headings and highlights on the Events page (individual events are managed under Events)." },
  { key: "notices", label: "Notices page copy", description: "Headings and quick links on the Notices page (individual notices are managed under Notices)." },
  { key: "results", label: "Results page", description: "Banner image for the Results page (yearly results are managed under Results)." },
  { key: "admission", label: "Admission page", description: "Admission status, process, eligibility, documents, dates and FAQs." },
  { key: "facilitiesPage", label: "Facilities page", description: "Facilities page headline, intro, section headings and campus-visit button. (Individual facilities and highlights are under Campus & facilities.)" },
  { key: "contactPage", label: "Contact page", description: "Contact page headline, description, hero photo, card labels and form title (address, phone and email are under Contact details)." },
  { key: "facultyPage", label: "Faculty page labels & quote", description: "Faculty page button labels, directory heading, quote and statistic labels." },
  { key: "getInTouch", label: "Get in touch section", description: "Homepage contact section headline, card and value strip." },
  { key: "footer", label: "Footer", description: "Footer mission line, feature strip, newsletter text and legal links." },
];

const isPlainObject = (v: unknown): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Union of keys across every item of a default array, so optional keys that only some defaults carry are still allowed. */
export function templateOf(arr: any[]): any {
  if (arr.length === 0) return undefined;
  if (!arr.some(isPlainObject)) return arr[0];
  const out: Record<string, any> = {};
  for (const item of arr) {
    if (!isPlainObject(item)) continue;
    for (const [k, v] of Object.entries(item)) {
      if (!(k in out) || out[k] === null || out[k] === undefined) out[k] = v;
      else if (isPlainObject(out[k]) && isPlainObject(v)) out[k] = templateOf([out[k], v]);
      else if (Array.isArray(out[k]) && out[k].length === 0 && Array.isArray(v)) out[k] = v;
    }
  }
  return out;
}

/** Defaults filled with saved overrides. Arrays are taken from the override whole; objects merge key by key. */
export function deepFill<T>(def: T, over: unknown): T {
  if (over === undefined || over === null) return def;
  if (Array.isArray(def)) return (Array.isArray(over) ? over : def) as T;
  if (isPlainObject(def)) {
    if (!isPlainObject(over)) return def;
    const out: Record<string, any> = {};
    for (const k of Object.keys(def)) out[k] = deepFill((def as any)[k], (over as any)[k]);
    return out as T;
  }
  return (typeof over === typeof def ? over : def) as T;
}

// Anything that could run script or smuggle a payload when used as a link or image address.
const UNSAFE_URL = /^\s*(javascript|vbscript|data)\s*:/i;

export type ValidationIssue = { path: string; message: string };

/** Validates `val` against the shape of `def`, returning a cleaned copy. Unknown keys are dropped; missing keys take the default. */
export function validateAgainstDefaults(def: any, val: any, path: string, issues: ValidationIssue[]): any {
  if (Array.isArray(def)) {
    if (!Array.isArray(val)) { issues.push({ path, message: "Expected a list" }); return def; }
    if (val.length > MAX_ARRAY) { issues.push({ path, message: `Too many items (max ${MAX_ARRAY})` }); return def; }
    const tpl = templateOf(def);
    return val.map((item, i) => (tpl === undefined ? sanitizeLoose(item, `${path}[${i}]`, issues) : validateAgainstDefaults(tpl, item, `${path}[${i}]`, issues)));
  }
  if (isPlainObject(def)) {
    if (!isPlainObject(val)) { issues.push({ path, message: "Expected an object" }); return def; }
    const out: Record<string, any> = {};
    for (const k of Object.keys(def)) {
      out[k] = k in val ? validateAgainstDefaults(def[k], val[k], path ? `${path}.${k}` : k, issues) : def[k];
    }
    return out;
  }
  if (typeof def === "string") {
    if (typeof val !== "string") { issues.push({ path, message: "Expected text" }); return def; }
    if (val.length > MAX_STRING) { issues.push({ path, message: `Too long (max ${MAX_STRING} characters)` }); return def; }
    if (UNSAFE_URL.test(val)) { issues.push({ path, message: "This kind of link is not allowed" }); return def; }
    return val;
  }
  if (typeof def === "number") {
    if (typeof val !== "number" || !Number.isFinite(val)) { issues.push({ path, message: "Expected a number" }); return def; }
    return val;
  }
  if (typeof def === "boolean") {
    if (typeof val !== "boolean") { issues.push({ path, message: "Expected yes/no" }); return def; }
    return val;
  }
  return sanitizeLoose(val, path, issues); // default was null/undefined: accept plain JSON
}

function sanitizeLoose(val: any, path: string, issues: ValidationIssue[]): any {
  if (val === null || typeof val === "number" || typeof val === "boolean") return val;
  if (typeof val === "string") {
    if (val.length > MAX_STRING) { issues.push({ path, message: `Too long (max ${MAX_STRING} characters)` }); return ""; }
    if (UNSAFE_URL.test(val)) { issues.push({ path, message: "This kind of link is not allowed" }); return ""; }
    return val;
  }
  if (Array.isArray(val)) return val.slice(0, MAX_ARRAY).map((v, i) => sanitizeLoose(v, `${path}[${i}]`, issues));
  if (isPlainObject(val)) return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, sanitizeLoose(v, `${path}.${k}`, issues)]));
  issues.push({ path, message: "Unsupported value" });
  return null;
}

/** Colours must be real CSS colours so the theme can't inject arbitrary CSS. Empty means "use the built-in colour". */
const COLOUR = /^(#[0-9a-fA-F]{3,8}|(rgb|hsl)a?\([0-9.,%\s/]+\))$/;
export function checkTheme(theme: Record<string, any>, issues: ValidationIssue[]) {
  for (const [k, v] of Object.entries(theme)) {
    if (typeof v === "string" && v.trim() !== "" && !COLOUR.test(v.trim())) issues.push({ path: `theme.${k}`, message: "Use a hex colour like #0a1a33" });
  }
}

/** Homepage blocks: every known block exactly once, hero always first and visible. */
export function normaliseHomepage(def: any, val: any) {
  const known: { id: string; label: string; visible: boolean }[] = def.sections;
  const seen = new Set<string>();
  const sections: typeof known = [];
  for (const s of val.sections ?? []) {
    const base = known.find((k) => k.id === s?.id);
    if (!base || seen.has(base.id)) continue;
    seen.add(base.id);
    sections.push({ id: base.id, label: base.label, visible: base.id === "hero" ? true : s.visible !== false });
  }
  for (const k of known) if (!seen.has(k.id)) sections.push({ ...k });
  const heroIdx = sections.findIndex((s) => s.id === "hero");
  if (heroIdx > 0) sections.unshift(...sections.splice(heroIdx, 1));
  return { sections };
}
