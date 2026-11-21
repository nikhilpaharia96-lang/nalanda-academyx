import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { eq, like } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { SITE_CONTENT_DEFAULTS } from "./defaults.generated";
import { SECTION_META, checkTheme, deepFill, normaliseHomepage, validateAgainstDefaults, type ValidationIssue } from "./site-content.shape";

export const KEY_PREFIX = "site_content:";

@Injectable()
export class SiteContentService {
  constructor(private readonly auditService: AuditService) {}

  private async savedSections(): Promise<Record<string, any>> {
    const rows = await db.select().from(schema.settings).where(like(schema.settings.key, `${KEY_PREFIX}%`));
    const out: Record<string, any> = {};
    for (const r of rows) {
      try { out[r.key.slice(KEY_PREFIX.length)] = JSON.parse(r.value); } catch { /* corrupt row: fall back to the default */ }
    }
    return out;
  }

  /** What the public website renders: defaults with every saved section layered on top. */
  async getEffective() {
    const saved = await this.savedSections();
    const content: Record<string, any> = {};
    for (const key of Object.keys(SITE_CONTENT_DEFAULTS)) content[key] = deepFill(SITE_CONTENT_DEFAULTS[key], saved[key]);
    return content;
  }

  /** Everything the admin editor needs: current value, built-in default, and whether it was customised. */
  async getForAdmin() {
    const saved = await this.savedSections();
    return {
      sections: SECTION_META.filter((m) => m.key in SITE_CONTENT_DEFAULTS).map((m) => ({
        ...m,
        value: deepFill(SITE_CONTENT_DEFAULTS[m.key], saved[m.key]),
        defaults: SITE_CONTENT_DEFAULTS[m.key],
        customized: m.key in saved,
      })),
    };
  }

  private requireKnown(section: string) {
    if (!(section in SITE_CONTENT_DEFAULTS)) throw new NotFoundException(`Unknown section "${section}"`);
  }

  async save(section: string, value: unknown, actorId: string) {
    this.requireKnown(section);
    const issues: ValidationIssue[] = [];
    let cleaned = validateAgainstDefaults(SITE_CONTENT_DEFAULTS[section], value, "", issues);
    if (section === "theme") checkTheme(cleaned, issues);
    if (issues.length) throw new BadRequestException({ message: "Some fields are invalid", issues: issues.slice(0, 20) });
    if (section === "homepage") cleaned = normaliseHomepage(SITE_CONTENT_DEFAULTS.homepage, cleaned);
    const key = KEY_PREFIX + section;
    const json = JSON.stringify(cleaned);
    const [existing] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    if (existing) await db.update(schema.settings).set({ value: json }).where(eq(schema.settings.key, key));
    else await db.insert(schema.settings).values({ key, value: json });
    await this.auditService.log({ userId: actorId, action: "SITE_CONTENT_UPDATE", entity: "SiteContent", entityId: section });
    return { section, value: cleaned, customized: true };
  }

  async reset(section: string, actorId: string) {
    this.requireKnown(section);
    await db.delete(schema.settings).where(eq(schema.settings.key, KEY_PREFIX + section));
    await this.auditService.log({ userId: actorId, action: "SITE_CONTENT_RESET", entity: "SiteContent", entityId: section });
    return { section, value: SITE_CONTENT_DEFAULTS[section], customized: false };
  }
}
