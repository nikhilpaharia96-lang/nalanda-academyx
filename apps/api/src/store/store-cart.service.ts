import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import type { AddBundleToCartDto, AddToCartDto } from "@nalanda/shared";

function effectivePrice(product: typeof schema.storeProducts.$inferSelect, variant?: typeof schema.storeProductVariants.$inferSelect | null) {
  if (variant) {
    const price = variant.priceOverride ?? product.price;
    const sale = variant.salePriceOverride ?? product.salePrice ?? null;
    return sale ?? price;
  }
  return product.salePrice ?? product.price;
}

@Injectable()
export class StoreCartService {
  constructor(private readonly ownershipService: OwnershipService) {}

  private async getOrCreateCart(userId: string, studentId: string) {
    const [existing] = await db.select().from(schema.storeCarts).where(and(eq(schema.storeCarts.userId, userId), eq(schema.storeCarts.studentId, studentId)));
    if (existing) return existing;
    const [row] = await db.insert(schema.storeCarts).values({ userId, studentId }).returning();
    return row;
  }

  async getCart(user: AuthenticatedUser, studentId: string) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const cart = await this.getOrCreateCart(user.sub, studentId);
    return this.buildCartView(cart.id);
  }

  private async buildCartView(cartId: string) {
    const items = await db.select().from(schema.storeCartItems).where(eq(schema.storeCartItems.cartId, cartId));
    const enriched = await Promise.all(
      items.map(async (item) => {
        const [product] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, item.productId));
        const variant = item.variantId ? (await db.select().from(schema.storeProductVariants).where(eq(schema.storeProductVariants.id, item.variantId)))[0] : null;
        if (!product) return null;
        const unitPrice = effectivePrice(product, variant);
        const available = variant ? variant.stockQuantity - variant.reservedQuantity : product.stockQuantity - product.reservedQuantity;
        return {
          id: item.id,
          productId: product.id,
          productName: product.name,
          imageUrl: product.imageUrl,
          variantId: variant?.id ?? null,
          variantLabel: variant?.label ?? null,
          quantity: item.quantity,
          unitPrice,
          lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
          available,
          exceedsAvailable: item.quantity > available,
        };
      }),
    );
    const validItems = enriched.filter((i): i is NonNullable<typeof i> => i !== null);
    const subtotal = Math.round(validItems.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
    return { cartId, items: validItems, subtotal };
  }

  async addItem(user: AuthenticatedUser, dto: AddToCartDto) {
    await this.ownershipService.assertCanAccessStudent(dto.studentId, user);

    const [product] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, dto.productId));
    if (!product || product.status !== "ACTIVE") throw new NotFoundException("Product not available");
    if (product.hasVariants && !dto.variantId) throw new BadRequestException("Please select a variant (size/color) for this product");
    if (!product.hasVariants && dto.variantId) throw new BadRequestException("This product does not have variants");

    if (dto.variantId) {
      const [variant] = await db.select().from(schema.storeProductVariants).where(eq(schema.storeProductVariants.id, dto.variantId));
      if (!variant || variant.productId !== product.id || !variant.active) throw new NotFoundException("Variant not available");
    }

    const cart = await this.getOrCreateCart(user.sub, dto.studentId);

    // SQL NULL comparisons make an inline "variantId IS NULL" match awkward
    // to express uniformly across both dialects via the query builder, so
    // fetch this product's existing cart rows (always a short list) and
    // match the variant in JS instead.
    const existingForProduct = await db.select().from(schema.storeCartItems).where(and(eq(schema.storeCartItems.cartId, cart.id), eq(schema.storeCartItems.productId, dto.productId)));
    const matched = existingForProduct.find((i) => (dto.variantId ? i.variantId === dto.variantId : !i.variantId));

    if (matched) {
      await db.update(schema.storeCartItems).set({ quantity: matched.quantity + dto.quantity }).where(eq(schema.storeCartItems.id, matched.id));
      return this.buildCartView(cart.id);
    }

    await db.insert(schema.storeCartItems).values({ cartId: cart.id, productId: dto.productId, variantId: dto.variantId, quantity: dto.quantity });
    return this.buildCartView(cart.id);
  }

  async addBundle(user: AuthenticatedUser, dto: AddBundleToCartDto) {
    await this.ownershipService.assertCanAccessStudent(dto.studentId, user);
    const [bundle] = await db.select().from(schema.storeBundles).where(eq(schema.storeBundles.id, dto.bundleId));
    if (!bundle || !bundle.active) throw new NotFoundException("Set not found");
    const bundleItems = await db.select().from(schema.storeBundleItems).where(eq(schema.storeBundleItems.bundleId, dto.bundleId));

    for (const bi of bundleItems) {
      await this.addItem(user, { studentId: dto.studentId, productId: bi.productId, quantity: bi.quantity });
    }
    const cart = await this.getOrCreateCart(user.sub, dto.studentId);
    return this.buildCartView(cart.id);
  }

  async updateItemQuantity(user: AuthenticatedUser, studentId: string, itemId: string, quantity: number) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const cart = await this.getOrCreateCart(user.sub, studentId);
    const [item] = await db.select().from(schema.storeCartItems).where(and(eq(schema.storeCartItems.id, itemId), eq(schema.storeCartItems.cartId, cart.id)));
    if (!item) throw new NotFoundException("Cart item not found");
    await db.update(schema.storeCartItems).set({ quantity }).where(eq(schema.storeCartItems.id, itemId));
    return this.buildCartView(cart.id);
  }

  async removeItem(user: AuthenticatedUser, studentId: string, itemId: string) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const cart = await this.getOrCreateCart(user.sub, studentId);
    await db.delete(schema.storeCartItems).where(and(eq(schema.storeCartItems.id, itemId), eq(schema.storeCartItems.cartId, cart.id)));
    return this.buildCartView(cart.id);
  }

  /** Internal helper used by checkout — not exposed directly as an endpoint. */
  async getOrCreateCartInternal(userId: string, studentId: string) {
    return this.getOrCreateCart(userId, studentId);
  }

  async clearCart(cartId: string) {
    await db.delete(schema.storeCartItems).where(eq(schema.storeCartItems.cartId, cartId));
  }
}
