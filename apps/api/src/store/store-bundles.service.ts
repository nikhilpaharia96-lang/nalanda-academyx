import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import type { CreateBundleDto, UpdateBundleDto } from "@nalanda/shared";

@Injectable()
export class StoreBundlesService {
  constructor(private readonly auditService: AuditService) {}

  async list() {
    const bundles = await db.select().from(schema.storeBundles);
    return Promise.all(
      bundles.map(async (b) => {
        const items = await db.select().from(schema.storeBundleItems).where(eq(schema.storeBundleItems.bundleId, b.id));
        const products = await Promise.all(items.map((i) => db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, i.productId))));
        const enrichedItems = items.map((i, idx) => ({ ...i, product: products[idx][0] ?? null }));
        const totalPrice = enrichedItems.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0);
        return { ...b, items: enrichedItems, totalPrice: Math.round(totalPrice * 100) / 100 };
      }),
    );
  }

  async create(dto: CreateBundleDto, actorId: string) {
    for (const item of dto.items) {
      const [product] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, item.productId));
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
    }

    const [bundle] = await db.insert(schema.storeBundles).values({ name: dto.name, description: dto.description, classId: dto.classId }).returning();
    await db.insert(schema.storeBundleItems).values(dto.items.map((i) => ({ bundleId: bundle.id, productId: i.productId, quantity: i.quantity })));
    await this.auditService.log({ userId: actorId, action: "STORE_BUNDLE_CREATE", entity: "StoreBundle", entityId: bundle.id });
    return bundle;
  }

  async update(id: string, dto: UpdateBundleDto, actorId: string) {
    const [existing] = await db.select().from(schema.storeBundles).where(eq(schema.storeBundles.id, id));
    if (!existing) throw new NotFoundException("Set not found");
    const [row] = await db
      .update(schema.storeBundles)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.storeBundles.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "STORE_BUNDLE_UPDATE", entity: "StoreBundle", entityId: id });
    return row;
  }

  /** Bundles for a given class (or class-agnostic ones) — buyer-facing. */
  async listForClass(classId: string) {
    const bundles = await db.select().from(schema.storeBundles).where(eq(schema.storeBundles.active, true));
    const relevant = bundles.filter((b) => !b.classId || b.classId === classId);
    return Promise.all(
      relevant.map(async (b) => {
        const items = await db.select().from(schema.storeBundleItems).where(eq(schema.storeBundleItems.bundleId, b.id));
        const products = await Promise.all(items.map((i) => db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, i.productId))));
        const enrichedItems = items.map((i, idx) => ({ ...i, product: products[idx][0] ?? null }));
        const totalPrice = enrichedItems.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0);
        return { ...b, items: enrichedItems, totalPrice: Math.round(totalPrice * 100) / 100 };
      }),
    );
  }
}
