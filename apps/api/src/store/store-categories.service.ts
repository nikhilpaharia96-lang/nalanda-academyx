import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import type { CreateStoreCategoryDto, UpdateStoreCategoryDto } from "@nalanda/shared";

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

@Injectable()
export class StoreCategoriesService {
  constructor(private readonly auditService: AuditService) {}

  list(includeInactive = false) {
    const q = db.select().from(schema.storeCategories).orderBy(asc(schema.storeCategories.displayOrder));
    if (includeInactive) return q;
    return db.select().from(schema.storeCategories).where(eq(schema.storeCategories.active, true)).orderBy(asc(schema.storeCategories.displayOrder));
  }

  async create(dto: CreateStoreCategoryDto, actorId: string) {
    const slug = slugify(dto.name);
    const [existing] = await db.select().from(schema.storeCategories).where(eq(schema.storeCategories.slug, slug));
    if (existing) throw new BadRequestException("A category with this name already exists");

    const [row] = await db
      .insert(schema.storeCategories)
      .values({ name: dto.name, slug, icon: dto.icon, displayOrder: dto.displayOrder ?? 0 })
      .returning();
    await this.auditService.log({ userId: actorId, action: "STORE_CATEGORY_CREATE", entity: "StoreCategory", entityId: row.id });
    return row;
  }

  async update(id: string, dto: UpdateStoreCategoryDto, actorId: string) {
    const [existing] = await db.select().from(schema.storeCategories).where(eq(schema.storeCategories.id, id));
    if (!existing) throw new NotFoundException("Category not found");

    const values: Partial<typeof schema.storeCategories.$inferInsert> = { updatedAt: new Date().toISOString() };
    if (dto.name !== undefined) {
      values.name = dto.name;
      values.slug = slugify(dto.name);
    }
    if (dto.icon !== undefined) values.icon = dto.icon;
    if (dto.displayOrder !== undefined) values.displayOrder = dto.displayOrder;
    if (dto.active !== undefined) values.active = dto.active;

    const [row] = await db.update(schema.storeCategories).set(values).where(eq(schema.storeCategories.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: "STORE_CATEGORY_UPDATE", entity: "StoreCategory", entityId: id });
    return row;
  }
}
