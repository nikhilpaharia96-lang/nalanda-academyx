import { Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36).slice(-4);
}

@Injectable()
export class EventsService {
  constructor(private readonly auditService: AuditService) {}

  async list(filters: { when?: "upcoming" | "past"; category?: string; includeUnpublished: boolean }) {
    const conditions: SQL[] = [];
    if (!filters.includeUnpublished) conditions.push(eq(schema.events.published, true));
    if (filters.category) conditions.push(eq(schema.events.category, filters.category));
    const today = new Date().toISOString().slice(0, 10);
    if (filters.when === "upcoming") conditions.push(gte(schema.events.date, today));
    if (filters.when === "past") conditions.push(lt(schema.events.date, today));

    return db
      .select()
      .from(schema.events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(filters.when === "past" ? desc(schema.events.date) : schema.events.date);
  }

  async getBySlug(slug: string, includeUnpublished: boolean) {
    const [row] = await db.select().from(schema.events).where(eq(schema.events.slug, slug));
    if (!row || (!row.published && !includeUnpublished)) throw new NotFoundException("Event not found");
    const images = await db.select().from(schema.eventImages).where(eq(schema.eventImages.eventId, row.id));
    return { ...row, images };
  }

  async create(dto: { title: string; description: string; category: string; date: string; time?: string; location?: string; featured?: boolean; coverImageUrl?: string }, actorId: string) {
    const [row] = await db.insert(schema.events).values({ ...dto, slug: slugify(dto.title) }).returning();
    await this.auditService.log({ userId: actorId, action: "EVENT_CREATE", entity: "Event", entityId: row.id });
    return row;
  }

  async update(id: string, dto: Partial<{ title: string; description: string; category: string; date: string; time: string; location: string; featured: boolean; coverImageUrl: string }>, actorId: string) {
    const [existing] = await db.select().from(schema.events).where(eq(schema.events.id, id));
    if (!existing) throw new NotFoundException("Event not found");
    const [row] = await db
      .update(schema.events)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.events.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "EVENT_UPDATE", entity: "Event", entityId: id });
    return row;
  }

  async setPublished(id: string, published: boolean, actorId: string) {
    const [existing] = await db.select().from(schema.events).where(eq(schema.events.id, id));
    if (!existing) throw new NotFoundException("Event not found");
    const [row] = await db.update(schema.events).set({ published, updatedAt: new Date().toISOString() }).where(eq(schema.events.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: published ? "EVENT_PUBLISH" : "EVENT_UNPUBLISH", entity: "Event", entityId: id });
    return row;
  }

  async addImage(eventId: string, imageUrl: string, displayOrder: number, actorId: string) {
    const [event] = await db.select().from(schema.events).where(eq(schema.events.id, eventId));
    if (!event) throw new NotFoundException("Event not found");
    const [row] = await db.insert(schema.eventImages).values({ eventId, imageUrl, displayOrder }).returning();
    await this.auditService.log({ userId: actorId, action: "EVENT_IMAGE_ADD", entity: "EventImage", entityId: row.id });
    return row;
  }
}
