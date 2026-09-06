import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, inArray, like, or } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { StoreInventoryService } from "./store-inventory.service";
import type {
  AddProductImageDto,
  CreateStoreProductDto,
  ListStoreProductsQuery,
  UpdateStoreProductDto,
  UpdateVariantDto,
  StoreVariantInput,
} from "@nalanda/shared";

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string) {
  let slug = slugify(base) || "product";
  let n = 1;
  // Small, bounded loop — product catalogs here are counted in the hundreds,
  // not millions, so a linear uniqueness probe is perfectly adequate.
  while (true) {
    const [existing] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.slug, slug));
    if (!existing) return slug;
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
}

@Injectable()
export class StoreProductsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly inventoryService: StoreInventoryService,
  ) {}

  // -------------------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------------------

  async listAdmin(query: ListStoreProductsQuery) {
    const conditions: any[] = [];
    if (query.categoryId) conditions.push(eq(schema.storeProducts.categoryId, query.categoryId));
    if (query.status) conditions.push(eq(schema.storeProducts.status, query.status));
    if (query.search) {
      conditions.push(or(like(schema.storeProducts.name, `%${query.search}%`), like(schema.storeProducts.sku, `%${query.search}%`)));
    }

    let productIds: string[] | undefined;
    if (query.classId) {
      const rows = await db.select().from(schema.storeProductClasses).where(eq(schema.storeProductClasses.classId, query.classId));
      productIds = rows.map((r) => r.productId);
      if (productIds.length === 0) return { items: [], total: 0, page: query.page, pageSize: query.pageSize };
      conditions.push(inArray(schema.storeProducts.id, productIds));
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const all = where ? await db.select().from(schema.storeProducts).where(where) : await db.select().from(schema.storeProducts);
    const total = all.length;
    const sorted = all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    const start = (query.page - 1) * query.pageSize;
    const pageItems = sorted.slice(start, start + query.pageSize);

    const categories = await db.select().from(schema.storeCategories);
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const items = await Promise.all(
      pageItems.map(async (p) => {
        const classes = await db.select().from(schema.storeProductClasses).where(eq(schema.storeProductClasses.productId, p.id));
        const classIds = classes.map((c) => c.classId);
        const available = p.hasVariants ? null : p.stockQuantity - p.reservedQuantity;
        return { ...p, category: categoryById.get(p.categoryId) ?? null, classIds, available };
      }),
    );

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getFullById(id: string) {
    const [product] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, id));
    if (!product) throw new NotFoundException("Product not found");
    const images = await db.select().from(schema.storeProductImages).where(eq(schema.storeProductImages.productId, id)).orderBy(asc(schema.storeProductImages.displayOrder));
    const variants = await db.select().from(schema.storeProductVariants).where(eq(schema.storeProductVariants.productId, id));
    const classLinks = await db.select().from(schema.storeProductClasses).where(eq(schema.storeProductClasses.productId, id));
    const classIds = classLinks.map((c) => c.classId);
    const available = product.hasVariants ? null : product.stockQuantity - product.reservedQuantity;
    return { ...product, images, variants, classIds, available };
  }

  async create(dto: CreateStoreProductDto, actorId: string) {
    const [category] = await db.select().from(schema.storeCategories).where(eq(schema.storeCategories.id, dto.categoryId));
    if (!category) throw new BadRequestException("Category not found");

    if (dto.sku) {
      const [existingSku] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.sku, dto.sku));
      if (existingSku) throw new BadRequestException("A product with this SKU already exists");
    }

    const slug = await uniqueSlug(dto.name);
    const hasVariants = Boolean(dto.variants && dto.variants.length > 0);

    const [product] = await db
      .insert(schema.storeProducts)
      .values({
        categoryId: dto.categoryId,
        name: dto.name,
        slug,
        sku: dto.sku,
        description: dto.description,
        price: dto.price,
        salePrice: dto.salePrice,
        imageUrl: dto.imageUrl,
        required: dto.required ?? false,
        hasVariants,
        academicYearId: dto.academicYearId,
        stockQuantity: hasVariants ? 0 : dto.stockQuantity ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
      })
      .returning();

    if (dto.classIds && dto.classIds.length > 0) {
      await db.insert(schema.storeProductClasses).values(dto.classIds.map((classId) => ({ productId: product.id, classId })));
    }

    if (hasVariants) {
      await this.insertVariants(product.id, dto.variants!);
    }

    await this.auditService.log({ userId: actorId, action: "STORE_PRODUCT_CREATE", entity: "StoreProduct", entityId: product.id });
    return this.getFullById(product.id);
  }

  private async insertVariants(productId: string, variants: StoreVariantInput[]) {
    for (const v of variants) {
      if (v.sku) {
        const [existing] = await db.select().from(schema.storeProductVariants).where(eq(schema.storeProductVariants.sku, v.sku));
        if (existing) throw new BadRequestException(`Variant SKU "${v.sku}" is already in use`);
      }
      await db.insert(schema.storeProductVariants).values({
        productId,
        label: v.label,
        attributes: v.attributes ? JSON.stringify(v.attributes) : undefined,
        sku: v.sku,
        priceOverride: v.priceOverride,
        salePriceOverride: v.salePriceOverride,
        stockQuantity: v.stockQuantity ?? 0,
        lowStockThreshold: v.lowStockThreshold ?? 5,
      });
    }
  }

  async update(id: string, dto: UpdateStoreProductDto, actorId: string) {
    const [existing] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, id));
    if (!existing) throw new NotFoundException("Product not found");

    if (dto.categoryId) {
      const [category] = await db.select().from(schema.storeCategories).where(eq(schema.storeCategories.id, dto.categoryId));
      if (!category) throw new BadRequestException("Category not found");
    }

    const values: Partial<typeof schema.storeProducts.$inferInsert> = { updatedAt: new Date().toISOString() };
    if (dto.categoryId !== undefined) values.categoryId = dto.categoryId;
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.sku !== undefined) values.sku = dto.sku;
    if (dto.description !== undefined) values.description = dto.description;
    if (dto.price !== undefined) values.price = dto.price;
    if (dto.salePrice !== undefined) values.salePrice = dto.salePrice;
    if (dto.imageUrl !== undefined) values.imageUrl = dto.imageUrl;
    if (dto.required !== undefined) values.required = dto.required;
    if (dto.academicYearId !== undefined) values.academicYearId = dto.academicYearId;
    if (dto.status !== undefined) values.status = dto.status;
    if (dto.lowStockThreshold !== undefined) values.lowStockThreshold = dto.lowStockThreshold;

    await db.update(schema.storeProducts).set(values).where(eq(schema.storeProducts.id, id));

    if (dto.classIds !== undefined) {
      await db.delete(schema.storeProductClasses).where(eq(schema.storeProductClasses.productId, id));
      if (dto.classIds.length > 0) {
        await db.insert(schema.storeProductClasses).values(dto.classIds.map((classId) => ({ productId: id, classId })));
      }
    }

    await this.auditService.log({ userId: actorId, action: "STORE_PRODUCT_UPDATE", entity: "StoreProduct", entityId: id });
    return this.getFullById(id);
  }

  async addImage(productId: string, dto: AddProductImageDto, actorId: string) {
    const [product] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, productId));
    if (!product) throw new NotFoundException("Product not found");
    const [row] = await db.insert(schema.storeProductImages).values({ productId, imageUrl: dto.imageUrl, displayOrder: dto.displayOrder ?? 0 }).returning();
    await this.auditService.log({ userId: actorId, action: "STORE_PRODUCT_IMAGE_ADD", entity: "StoreProduct", entityId: productId });
    return row;
  }

  async removeImage(productId: string, imageId: string, actorId: string) {
    await db.delete(schema.storeProductImages).where(and(eq(schema.storeProductImages.id, imageId), eq(schema.storeProductImages.productId, productId)));
    await this.auditService.log({ userId: actorId, action: "STORE_PRODUCT_IMAGE_REMOVE", entity: "StoreProduct", entityId: productId });
    return { success: true };
  }

  async addVariant(productId: string, dto: StoreVariantInput, actorId: string) {
    const [product] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, productId));
    if (!product) throw new NotFoundException("Product not found");
    await this.insertVariants(productId, [dto]);
    if (!product.hasVariants) {
      // First variant added to a previously simple product — flip the flag
      // and zero out the product-level counters so they can't be double-counted.
      await db.update(schema.storeProducts).set({ hasVariants: true, stockQuantity: 0, reservedQuantity: 0, updatedAt: new Date().toISOString() }).where(eq(schema.storeProducts.id, productId));
    }
    await this.auditService.log({ userId: actorId, action: "STORE_VARIANT_CREATE", entity: "StoreProduct", entityId: productId });
    return this.getFullById(productId);
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto, actorId: string) {
    const [existing] = await db.select().from(schema.storeProductVariants).where(eq(schema.storeProductVariants.id, variantId));
    if (!existing) throw new NotFoundException("Variant not found");

    const values: Partial<typeof schema.storeProductVariants.$inferInsert> = { updatedAt: new Date().toISOString() };
    if (dto.label !== undefined) values.label = dto.label;
    if (dto.attributes !== undefined) values.attributes = JSON.stringify(dto.attributes);
    if (dto.sku !== undefined) values.sku = dto.sku;
    if (dto.priceOverride !== undefined) values.priceOverride = dto.priceOverride;
    if (dto.salePriceOverride !== undefined) values.salePriceOverride = dto.salePriceOverride;
    if (dto.lowStockThreshold !== undefined) values.lowStockThreshold = dto.lowStockThreshold;
    if (dto.active !== undefined) values.active = dto.active;

    const [row] = await db.update(schema.storeProductVariants).set(values).where(eq(schema.storeProductVariants.id, variantId)).returning();
    await this.auditService.log({ userId: actorId, action: "STORE_VARIANT_UPDATE", entity: "StoreProductVariant", entityId: variantId });
    return row;
  }

  // -------------------------------------------------------------------
  // STUDENT / PARENT CATALOG (buyer-facing)
  // -------------------------------------------------------------------

  /** Products visible to a given student: ACTIVE status, and either
   * assigned to that student's class or assigned to no class at all
   * (meaning "available to every class" — uniforms, stationery, etc). */
  async listForStudent(studentId: string) {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");

    const active = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.status, "ACTIVE"));
    const classLinks = await db.select().from(schema.storeProductClasses);
    const linkedProductIds = new Set(classLinks.map((l) => l.productId));
    const productIdsForClass = new Set(classLinks.filter((l) => l.classId === student.classId).map((l) => l.productId));

    const visible = active.filter((p) => !linkedProductIds.has(p.id) || productIdsForClass.has(p.id));

    const categories = await db.select().from(schema.storeCategories);
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const items = await Promise.all(
      visible.map(async (p) => {
        const variants = p.hasVariants
          ? await db.select().from(schema.storeProductVariants).where(and(eq(schema.storeProductVariants.productId, p.id), eq(schema.storeProductVariants.active, true)))
          : [];
        const images = await db.select().from(schema.storeProductImages).where(eq(schema.storeProductImages.productId, p.id)).orderBy(asc(schema.storeProductImages.displayOrder));
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          imageUrl: p.imageUrl,
          images,
          price: p.price,
          salePrice: p.salePrice,
          required: p.required,
          category: categoryById.get(p.categoryId) ?? null,
          hasVariants: p.hasVariants,
          available: p.hasVariants ? null : p.stockQuantity - p.reservedQuantity,
          inStock: p.hasVariants ? variants.some((v) => v.stockQuantity - v.reservedQuantity > 0) : p.stockQuantity - p.reservedQuantity > 0,
          variants: variants.map((v) => ({
            id: v.id,
            label: v.label,
            attributes: v.attributes ? JSON.parse(v.attributes) : null,
            price: v.priceOverride ?? p.price,
            salePrice: v.salePriceOverride ?? p.salePrice,
            available: v.stockQuantity - v.reservedQuantity,
          })),
        };
      }),
    );

    return {
      studentClassId: student.classId,
      required: items.filter((i) => i.required),
      optional: items.filter((i) => !i.required),
    };
  }
}
