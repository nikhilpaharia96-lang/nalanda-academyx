import { Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq, like, or, type SQL, and } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36).slice(-4);
}

@Injectable()
export class NoticesService {
  constructor(private readonly auditService: AuditService) {}

  async list(filters: { search?: string; category?: string; includeUnpublished: boolean }) {
    const conditions: SQL[] = [];
    if (!filters.includeUnpublished) conditions.push(eq(schema.notices.published, true));
    if (filters.category) conditions.push(eq(schema.notices.category, filters.category));
    if (filters.search) {
      const clause = or(like(schema.notices.title, `%${filters.search}%`), like(schema.notices.content, `%${filters.search}%`));
      if (clause) conditions.push(clause);
    }
    return db
      .select()
      .from(schema.notices)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.notices.publishedAt));
  }

  async getBySlug(slug: string, includeUnpublished: boolean) {
    const [row] = await db.select().from(schema.notices).where(eq(schema.notices.slug, slug));
    // Fail closed: an unpublished notice 404s for anyone who isn't an admin,
    // exactly like it doesn't exist — never leak draft content by slug.
    if (!row || (!row.published && !includeUnpublished)) throw new NotFoundException("Notice not found");
    return row;
  }

  async create(dto: { title: string; content: string; category: string; important?: boolean; attachmentUrl?: string }, actorId: string) {
    const [row] = await db
      .insert(schema.notices)
      .values({ ...dto, slug: slugify(dto.title), createdBy: actorId })
      .returning();
    await this.auditService.log({ userId: actorId, action: "NOTICE_CREATE", entity: "Notice", entityId: row.id });
    return row;
  }

  async update(id: string, dto: Partial<{ title: string; content: string; category: string; important: boolean; attachmentUrl: string }>, actorId: string) {
    const [existing] = await db.select().from(schema.notices).where(eq(schema.notices.id, id));
    if (!existing) throw new NotFoundException("Notice not found");
    const [row] = await db
      .update(schema.notices)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.notices.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "NOTICE_UPDATE", entity: "Notice", entityId: id });
    return row;
  }

  async setPublished(id: string, published: boolean, actorId: string) {
    const [existing] = await db.select().from(schema.notices).where(eq(schema.notices.id, id));
    if (!existing) throw new NotFoundException("Notice not found");
    const [row] = await db
      .update(schema.notices)
      .set({ published, publishedAt: published ? new Date().toISOString() : existing.publishedAt, updatedAt: new Date().toISOString() })
      .where(eq(schema.notices.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: published ? "NOTICE_PUBLISH" : "NOTICE_UNPUBLISH", entity: "Notice", entityId: id });
    return row;
  }
}
