import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";

/** Either a bare product row or a variant row — both shapes carry the same
 * three stock columns, which is all the atomic helpers below need. */
type StockRow = { id: string; stockQuantity: number; reservedQuantity: number };

@Injectable()
export class StoreInventoryService {
  /**
   * IMPORTANT — why this file does NOT use `db.transaction(...)`:
   *
   * This project runs on two different Drizzle drivers depending on
   * DATABASE_URL (see packages/database/index.ts): `better-sqlite3` for
   * local dev, real `pg`/node-postgres in production. better-sqlite3's
   * transaction wrapper requires a fully SYNCHRONOUS callback — it throws
   * immediately ("this transaction function is unable to return a promise")
   * if given an `async` function, which every multi-step Drizzle query in
   * this codebase inherently is (every service in apps/api already awaits
   * db.select/insert/update calls). Wrapping the reserve/confirm/release
   * logic below in `db.transaction(async (tx) => ...)` would work on
   * Postgres but crash outright in local dev on SQLite — that's not an
   * acceptable trade-off for a feature that has to run in both.
   *
   * Instead, every stock mutation here is a SINGLE atomic UPDATE with the
   * availability check built into its own WHERE clause (a guarded
   * conditional update), e.g.:
   *
   *   UPDATE store_products
   *   SET reserved_quantity = reserved_quantity + :qty
   *   WHERE id = :id AND (stock_quantity - reserved_quantity) >= :qty
   *
   * A single UPDATE statement is always atomic on both SQLite and Postgres
   * regardless of any wrapping transaction, so this is safe under
   * concurrent requests without depending on driver-specific multi-statement
   * transaction support. For an order with several line items, each item's
   * reservation is its own atomic step; if a later item fails (insufficient
   * stock), the items already reserved for that same checkout are released
   * again (compensating action) before the request fails — so a partially
   * reservable cart never leaves stock silently held.
   */

  private table(hasVariant: boolean) {
    return hasVariant ? schema.storeProductVariants : schema.storeProducts;
  }

  private async getRow(productId: string, variantId: string | null | undefined): Promise<StockRow> {
    if (variantId) {
      const [row] = await db.select().from(schema.storeProductVariants).where(eq(schema.storeProductVariants.id, variantId));
      if (!row) throw new NotFoundException("Product variant not found");
      return row;
    }
    const [row] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, productId));
    if (!row) throw new NotFoundException("Product not found");
    return row;
  }

  async getAvailable(productId: string, variantId: string | null | undefined): Promise<number> {
    const row = await this.getRow(productId, variantId);
    return row.stockQuantity - row.reservedQuantity;
  }

  private async logTransaction(params: {
    productId: string;
    variantId?: string | null;
    type: "RESTOCK" | "ADJUSTMENT" | "RESERVE" | "RELEASE" | "SALE" | "RETURN";
    quantityChange: number;
    stockAfter: number;
    reservedAfter: number;
    note?: string;
    orderId?: string;
    actorUserId?: string;
  }) {
    await db.insert(schema.storeInventoryTransactions).values({
      productId: params.productId,
      variantId: params.variantId ?? undefined,
      type: params.type,
      quantityChange: params.quantityChange,
      stockAfter: params.stockAfter,
      reservedAfter: params.reservedAfter,
      note: params.note,
      orderId: params.orderId,
      actorUserId: params.actorUserId,
    });
  }

  /** Holds `quantity` units against a PENDING order. Throws if not enough
   * available stock (stock - already-reserved) remains. */
  async reserve(productId: string, variantId: string | null | undefined, quantity: number, opts: { orderId?: string; actorUserId?: string; note?: string } = {}) {
    if (variantId) {
      const [row] = await db
        .update(schema.storeProductVariants)
        .set({ reservedQuantity: sql`${schema.storeProductVariants.reservedQuantity} + ${quantity}` })
        .where(
          and(
            eq(schema.storeProductVariants.id, variantId),
            sql`(${schema.storeProductVariants.stockQuantity} - ${schema.storeProductVariants.reservedQuantity}) >= ${quantity}`,
          ),
        )
        .returning();
      if (!row) throw new BadRequestException("Not enough stock available for this item");
      await this.logTransaction({ productId, variantId, type: "RESERVE", quantityChange: quantity, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, ...opts });
      return row;
    }
    const [row] = await db
      .update(schema.storeProducts)
      .set({ reservedQuantity: sql`${schema.storeProducts.reservedQuantity} + ${quantity}` })
      .where(and(eq(schema.storeProducts.id, productId), sql`(${schema.storeProducts.stockQuantity} - ${schema.storeProducts.reservedQuantity}) >= ${quantity}`))
      .returning();
    if (!row) throw new BadRequestException("Not enough stock available for this item");
    await this.logTransaction({ productId, type: "RESERVE", quantityChange: quantity, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, ...opts });
    return row;
  }

  /** Releases a previously-held reservation without touching physical stock
   * (order cancelled/expired before payment). */
  async release(productId: string, variantId: string | null | undefined, quantity: number, opts: { orderId?: string; actorUserId?: string; note?: string } = {}) {
    if (variantId) {
      const [row] = await db
        .update(schema.storeProductVariants)
        .set({ reservedQuantity: sql`max(${schema.storeProductVariants.reservedQuantity} - ${quantity}, 0)` })
        .where(eq(schema.storeProductVariants.id, variantId))
        .returning();
      if (row) await this.logTransaction({ productId, variantId, type: "RELEASE", quantityChange: -quantity, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, ...opts });
      return row;
    }
    const [row] = await db
      .update(schema.storeProducts)
      .set({ reservedQuantity: sql`max(${schema.storeProducts.reservedQuantity} - ${quantity}, 0)` })
      .where(eq(schema.storeProducts.id, productId))
      .returning();
    if (row) await this.logTransaction({ productId, type: "RELEASE", quantityChange: -quantity, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, ...opts });
    return row;
  }

  /** Converts a reservation into a real sale: physical stock and the
   * reservation both drop together. Guarded so it can never run twice for
   * the same units (the guard requires enough of BOTH stock and reserved
   * remaining) — this is what makes duplicate webhook/verify calls safe:
   * the caller must additionally check order/payment status before calling
   * this (see StoreOrdersService.confirmPaid), but even if that check were
   * ever bypassed, a second call here would simply fail its WHERE guard
   * once reservedQuantity has already been decremented to 0. */
  async confirmSale(productId: string, variantId: string | null | undefined, quantity: number, opts: { orderId?: string; actorUserId?: string; note?: string } = {}) {
    if (variantId) {
      const [row] = await db
        .update(schema.storeProductVariants)
        .set({
          stockQuantity: sql`${schema.storeProductVariants.stockQuantity} - ${quantity}`,
          reservedQuantity: sql`${schema.storeProductVariants.reservedQuantity} - ${quantity}`,
        })
        .where(and(eq(schema.storeProductVariants.id, variantId), sql`${schema.storeProductVariants.reservedQuantity} >= ${quantity}`, sql`${schema.storeProductVariants.stockQuantity} >= ${quantity}`))
        .returning();
      if (!row) return null; // already confirmed (idempotent no-op) or data inconsistency — caller decides
      await this.logTransaction({ productId, variantId, type: "SALE", quantityChange: -quantity, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, ...opts });
      return row;
    }
    const [row] = await db
      .update(schema.storeProducts)
      .set({
        stockQuantity: sql`${schema.storeProducts.stockQuantity} - ${quantity}`,
        reservedQuantity: sql`${schema.storeProducts.reservedQuantity} - ${quantity}`,
      })
      .where(and(eq(schema.storeProducts.id, productId), sql`${schema.storeProducts.reservedQuantity} >= ${quantity}`, sql`${schema.storeProducts.stockQuantity} >= ${quantity}`))
      .returning();
    if (!row) return null;
    await this.logTransaction({ productId, type: "SALE", quantityChange: -quantity, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, ...opts });
    return row;
  }

  /** Admin restock / correction / return. `quantityChange` may be negative
   * (e.g. damaged-goods write-off) but stock can never go below 0. */
  async adjust(productId: string, variantId: string | null | undefined, quantityChange: number, opts: { actorUserId?: string; note?: string; type?: "RESTOCK" | "ADJUSTMENT" | "RETURN" } = {}) {
    const type = opts.type ?? (quantityChange > 0 ? "RESTOCK" : "ADJUSTMENT");
    if (variantId) {
      const [row] = await db
        .update(schema.storeProductVariants)
        .set({ stockQuantity: sql`${schema.storeProductVariants.stockQuantity} + ${quantityChange}` })
        .where(and(eq(schema.storeProductVariants.id, variantId), sql`(${schema.storeProductVariants.stockQuantity} + ${quantityChange}) >= 0`))
        .returning();
      if (!row) throw new BadRequestException("Resulting stock cannot be negative");
      await this.logTransaction({ productId, variantId, type, quantityChange, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, note: opts.note, actorUserId: opts.actorUserId });
      return row;
    }
    const [row] = await db
      .update(schema.storeProducts)
      .set({ stockQuantity: sql`${schema.storeProducts.stockQuantity} + ${quantityChange}` })
      .where(and(eq(schema.storeProducts.id, productId), sql`(${schema.storeProducts.stockQuantity} + ${quantityChange}) >= 0`))
      .returning();
    if (!row) throw new BadRequestException("Resulting stock cannot be negative");
    await this.logTransaction({ productId, type, quantityChange, stockAfter: row.stockQuantity, reservedAfter: row.reservedQuantity, note: opts.note, actorUserId: opts.actorUserId });
    return row;
  }

  async history(productId: string) {
    return db
      .select()
      .from(schema.storeInventoryTransactions)
      .where(eq(schema.storeInventoryTransactions.productId, productId))
      .orderBy(sql`${schema.storeInventoryTransactions.createdAt} desc`);
  }

  /** Full inventory list for the Admin Inventory screen — one row per
   * product (no variants) or per variant (product has variants). */
  async listInventory() {
    const products = await db.select().from(schema.storeProducts);
    const variants = await db.select().from(schema.storeProductVariants);
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const list = variantsByProduct.get(v.productId) ?? [];
      list.push(v);
      variantsByProduct.set(v.productId, list);
    }

    const rows: Array<{
      productId: string;
      variantId: string | null;
      productName: string;
      variantLabel: string | null;
      sku: string | null;
      stockQuantity: number;
      reservedQuantity: number;
      available: number;
      lowStockThreshold: number;
      lowStock: boolean;
    }> = [];

    for (const p of products) {
      if (p.hasVariants) {
        for (const v of variantsByProduct.get(p.id) ?? []) {
          const available = v.stockQuantity - v.reservedQuantity;
          rows.push({
            productId: p.id,
            variantId: v.id,
            productName: p.name,
            variantLabel: v.label,
            sku: v.sku,
            stockQuantity: v.stockQuantity,
            reservedQuantity: v.reservedQuantity,
            available,
            lowStockThreshold: v.lowStockThreshold,
            lowStock: available <= v.lowStockThreshold,
          });
        }
      } else {
        const available = p.stockQuantity - p.reservedQuantity;
        rows.push({
          productId: p.id,
          variantId: null,
          productName: p.name,
          variantLabel: null,
          sku: p.sku,
          stockQuantity: p.stockQuantity,
          reservedQuantity: p.reservedQuantity,
          available,
          lowStockThreshold: p.lowStockThreshold,
          lowStock: available <= p.lowStockThreshold,
        });
      }
    }
    return rows;
  }
}
