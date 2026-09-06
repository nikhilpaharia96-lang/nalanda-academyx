import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { NotificationsService } from "../notifications/notifications.service";
import { StoreInventoryService } from "./store-inventory.service";
import { StoreCartService } from "./store-cart.service";
import { StoreSettingsService } from "./store-settings.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import type { CheckoutDto, ListStoreOrdersQuery, UpdateOrderStatusDto } from "@nalanda/shared";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class StoreOrdersService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
    private readonly notificationsService: NotificationsService,
    private readonly inventoryService: StoreInventoryService,
    private readonly cartService: StoreCartService,
    private readonly settingsService: StoreSettingsService,
  ) {}

  private async nextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const key = `store_order_counter_${year}`;
    const [existing] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    const next = existing ? Number(existing.value) + 1 : 1;
    if (existing) {
      await db.update(schema.settings).set({ value: String(next) }).where(eq(schema.settings.key, key));
    } else {
      await db.insert(schema.settings).values({ key, value: String(next) });
    }
    return `ORD-${year}-${String(next).padStart(6, "0")}`;
  }

  private async validateCoupon(code: string, subtotal: number) {
    const [coupon] = await db.select().from(schema.storeCoupons).where(eq(schema.storeCoupons.code, code.toUpperCase()));
    if (!coupon || !coupon.active) throw new BadRequestException("Invalid or inactive coupon code");
    const now = new Date().toISOString();
    if (coupon.validFrom && now < coupon.validFrom) throw new BadRequestException("This coupon is not active yet");
    if (coupon.validUntil && now > coupon.validUntil) throw new BadRequestException("This coupon has expired");
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new BadRequestException("This coupon has reached its usage limit");
    if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) throw new BadRequestException(`This coupon requires a minimum order of ₹${coupon.minOrderAmount}`);

    const discount = coupon.discountType === "PERCENT" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
    return { coupon, discount: round2(Math.min(discount, subtotal)) };
  }

  /**
   * Checkout: computed entirely server-side (price, discount, delivery fee,
   * total) — nothing from the client's cached cart totals is trusted, per
   * spec §22. Stock is RESERVED here (not yet deducted) using the atomic,
   * overselling-safe primitives in StoreInventoryService; a real deduction
   * only happens once payment is verified (see confirmPaid below). If any
   * line item can't be reserved (insufficient stock), every item already
   * reserved earlier in this same checkout is released again before the
   * request fails, so a failed checkout never leaves stock silently held.
   */
  async checkout(user: AuthenticatedUser, dto: CheckoutDto) {
    await this.ownershipService.assertCanAccessStudent(dto.studentId, user);

    const cart = await this.cartService.getOrCreateCartInternal(user.sub, dto.studentId);
    const cartItems = await db.select().from(schema.storeCartItems).where(eq(schema.storeCartItems.cartId, cart.id));
    if (cartItems.length === 0) throw new BadRequestException("Your cart is empty");

    const settings = await this.settingsService.get();
    if (dto.fulfillmentMethod === "DELIVERY" && !settings.deliveryAvailable) {
      throw new BadRequestException("Home delivery is not available — please choose School Collection");
    }
    if (dto.fulfillmentMethod === "PICKUP" && !settings.pickupAvailable) {
      throw new BadRequestException("School collection is not currently available — please contact the school office");
    }

    // Resolve server-truth line items (price recomputed from the product /
    // variant rows right now, never from anything cached in the cart item).
    type ResolvedLine = { productId: string; variantId: string | null; productName: string; variantLabel: string | null; sku: string | null; unitPrice: number; quantity: number };
    const lines: ResolvedLine[] = [];
    for (const item of cartItems) {
      const [product] = await db.select().from(schema.storeProducts).where(eq(schema.storeProducts.id, item.productId));
      if (!product || product.status !== "ACTIVE") throw new BadRequestException(`"${product?.name ?? "An item"}" in your cart is no longer available`);
      let variant: typeof schema.storeProductVariants.$inferSelect | null = null;
      if (item.variantId) {
        [variant] = await db.select().from(schema.storeProductVariants).where(eq(schema.storeProductVariants.id, item.variantId));
        if (!variant || !variant.active) throw new BadRequestException(`A selected variant of "${product.name}" is no longer available`);
      }
      const price = variant ? variant.priceOverride ?? product.price : product.price;
      const sale = variant ? variant.salePriceOverride ?? product.salePrice : product.salePrice;
      lines.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        productName: product.name,
        variantLabel: variant?.label ?? null,
        sku: variant?.sku ?? product.sku,
        unitPrice: sale ?? price,
        quantity: item.quantity,
      });
    }

    const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));

    let discountAmount = 0;
    let couponId: string | undefined;
    if (dto.couponCode) {
      const { coupon, discount } = await this.validateCoupon(dto.couponCode, subtotal);
      discountAmount = discount;
      couponId = coupon.id;
    }

    const deliveryFee = dto.fulfillmentMethod === "DELIVERY" ? settings.deliveryFee : 0;
    const totalAmount = round2(Math.max(subtotal - discountAmount + deliveryFee, 0));
    const orderNumber = await this.nextOrderNumber();

    const [order] = await db
      .insert(schema.storeOrders)
      .values({
        orderNumber,
        userId: user.sub,
        studentId: dto.studentId,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        discountAmount,
        deliveryFee,
        totalAmount,
        couponId,
        fulfillmentMethod: dto.fulfillmentMethod,
        contactPhone: dto.contactPhone,
        contactAddress: dto.contactAddress,
        notes: dto.notes,
      })
      .returning();

    // Reserve stock for every line item; roll back (release) anything
    // already reserved in this same checkout if a later item fails.
    const reserved: ResolvedLine[] = [];
    try {
      for (const line of lines) {
        await this.inventoryService.reserve(line.productId, line.variantId, line.quantity, { orderId: order.id, actorUserId: user.sub, note: `Reserved for order ${order.orderNumber}` });
        reserved.push(line);
      }
    } catch (err) {
      for (const line of reserved) {
        await this.inventoryService.release(line.productId, line.variantId, line.quantity, { orderId: order.id, actorUserId: user.sub, note: `Released — checkout failed for order ${order.orderNumber}` });
      }
      await db.delete(schema.storeOrders).where(eq(schema.storeOrders.id, order.id));
      throw err;
    }

    await db.insert(schema.storeOrderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        variantLabel: l.variantLabel,
        sku: l.sku,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: round2(l.unitPrice * l.quantity),
      })),
    );

    if (couponId) {
      await db.update(schema.storeCoupons).set({ usedCount: sql`${schema.storeCoupons.usedCount} + 1` }).where(eq(schema.storeCoupons.id, couponId));
    }

    await this.cartService.clearCart(cart.id);
    await this.auditService.log({ userId: user.sub, action: "STORE_ORDER_CREATE", entity: "StoreOrder", entityId: order.id, description: `Total ₹${totalAmount}` });

    return this.getOrderWithItems(order.id);
  }

  async getOrderWithItems(orderId: string) {
    const [order] = await db.select().from(schema.storeOrders).where(eq(schema.storeOrders.id, orderId));
    if (!order) throw new NotFoundException("Order not found");
    const items = await db.select().from(schema.storeOrderItems).where(eq(schema.storeOrderItems.orderId, orderId));
    return { ...order, items };
  }

  async getOrderForUser(orderId: string, user: AuthenticatedUser) {
    const order = await this.getOrderWithItems(orderId);
    await this.ownershipService.assertCanAccessStudent(order.studentId, user);
    return order;
  }

  /** Called by PaymentsService once a store-order payment is verified PAID.
   * Idempotent: if the order isn't PENDING anymore, this is a no-op — this
   * is what makes a duplicate webhook/verify call safe (spec §22/25). */
  async confirmPaid(orderId: string, opts: { paymentId: string; actorUserId?: string }) {
    const [order] = await db.select().from(schema.storeOrders).where(eq(schema.storeOrders.id, orderId));
    if (!order) throw new NotFoundException("Store order not found");
    if (order.status !== "PENDING") {
      return { alreadyProcessed: true, order };
    }

    const items = await db.select().from(schema.storeOrderItems).where(eq(schema.storeOrderItems.orderId, orderId));
    for (const item of items) {
      await this.inventoryService.confirmSale(item.productId, item.variantId, item.quantity, { orderId, actorUserId: opts.actorUserId, note: `Sale — order ${order.orderNumber}` });
    }

    const [updated] = await db
      .update(schema.storeOrders)
      .set({ status: "CONFIRMED", paymentStatus: "PAID", paymentId: opts.paymentId, updatedAt: new Date().toISOString() })
      .where(eq(schema.storeOrders.id, orderId))
      .returning();

    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, order.studentId));
    if (student) {
      await this.notificationsService.notify(student.userId, "Order confirmed", `Your School Store order ${order.orderNumber} has been confirmed.`, "GENERAL");
    }
    if (order.userId !== student?.userId) {
      await this.notificationsService.notify(order.userId, "Order confirmed", `Your School Store order ${order.orderNumber} has been confirmed.`, "GENERAL");
    }

    return { order: updated, items };
  }

  // -------------------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------------------

  async listAdmin(query: ListStoreOrdersQuery) {
    const conditions: any[] = [];
    if (query.status) conditions.push(eq(schema.storeOrders.status, query.status));
    if (query.studentId) conditions.push(eq(schema.storeOrders.studentId, query.studentId));
    const where = conditions.length ? and(...conditions) : undefined;
    const rows = where
      ? await db.select().from(schema.storeOrders).where(where).orderBy(desc(schema.storeOrders.createdAt))
      : await db.select().from(schema.storeOrders).orderBy(desc(schema.storeOrders.createdAt));

    const total = rows.length;
    const start = (query.page - 1) * query.pageSize;
    const pageRows = rows.slice(start, start + query.pageSize);

    const items = await Promise.all(
      pageRows.map(async (o) => {
        const [student] = await db.select().from(schema.students).where(eq(schema.students.id, o.studentId));
        const orderItems = await db.select().from(schema.storeOrderItems).where(eq(schema.storeOrderItems.orderId, o.id));
        return { ...o, studentName: student?.name ?? "Unknown", itemCount: orderItems.reduce((s, i) => s + i.quantity, 0) };
      }),
    );

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listMine(user: AuthenticatedUser) {
    if (user.role === "STUDENT") {
      const rows = await db.select().from(schema.storeOrders).where(eq(schema.storeOrders.studentId, user.profileId!)).orderBy(desc(schema.storeOrders.createdAt));
      return Promise.all(rows.map((o) => this.getOrderWithItems(o.id)));
    }
    if (user.role === "PARENT") {
      const childIds = await this.ownershipService.getLinkedStudentIds(user.profileId!);
      if (childIds.length === 0) return [];
      const all = await Promise.all(childIds.map((id) => db.select().from(schema.storeOrders).where(eq(schema.storeOrders.studentId, id))));
      const rows = all.flat().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      return Promise.all(rows.map((o) => this.getOrderWithItems(o.id)));
    }
    const rows = await db.select().from(schema.storeOrders).orderBy(desc(schema.storeOrders.createdAt));
    return Promise.all(rows.map((o) => this.getOrderWithItems(o.id)));
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, actorId: string) {
    const [order] = await db.select().from(schema.storeOrders).where(eq(schema.storeOrders.id, orderId));
    if (!order) throw new NotFoundException("Order not found");

    if (dto.status === "CANCELLED") {
      return this.cancelOrder(orderId, actorId);
    }

    const [updated] = await db.update(schema.storeOrders).set({ status: dto.status, updatedAt: new Date().toISOString() }).where(eq(schema.storeOrders.id, orderId)).returning();
    await this.auditService.log({ userId: actorId, action: "STORE_ORDER_STATUS_UPDATE", entity: "StoreOrder", entityId: orderId, description: dto.status });

    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, order.studentId));
    if (student) {
      await this.notificationsService.notify(student.userId, "Order status updated", `Your School Store order ${order.orderNumber} is now ${dto.status.replace(/_/g, " ").toLowerCase()}.`, "GENERAL");
    }

    return updated;
  }

  /** Cancelling a PENDING (unpaid) order releases its stock reservation.
   * Cancelling an already-CONFIRMED (paid) order restocks the physical
   * inventory (a RETURN transaction) and marks the order paymentStatus as
   * REFUNDED for bookkeeping — this does NOT call Razorpay's refund API.
   * Actually issuing the money-movement side of a refund is a deliberate
   * manual step for Admin today (same as this project's existing fee
   * payments have no automated refund flow either); wiring a real
   * razorpay.payments.refund() call is a clean, isolated follow-up. */
  async cancelOrder(orderId: string, actorId: string) {
    const [order] = await db.select().from(schema.storeOrders).where(eq(schema.storeOrders.id, orderId));
    if (!order) throw new NotFoundException("Order not found");
    if (order.status === "CANCELLED") return order;

    const items = await db.select().from(schema.storeOrderItems).where(eq(schema.storeOrderItems.orderId, orderId));
    const wasPaid = order.status !== "PENDING";

    for (const item of items) {
      if (wasPaid) {
        await this.inventoryService.adjust(item.productId, item.variantId, item.quantity, { actorUserId: actorId, note: `Restock — order ${order.orderNumber} cancelled`, type: "RETURN" });
      } else {
        await this.inventoryService.release(item.productId, item.variantId, item.quantity, { orderId, actorUserId: actorId, note: `Released — order ${order.orderNumber} cancelled` });
      }
    }

    const [updated] = await db
      .update(schema.storeOrders)
      .set({ status: "CANCELLED", paymentStatus: wasPaid ? "REFUNDED" : "CANCELLED", updatedAt: new Date().toISOString() })
      .where(eq(schema.storeOrders.id, orderId))
      .returning();

    await this.auditService.log({ userId: actorId, action: "STORE_ORDER_CANCEL", entity: "StoreOrder", entityId: orderId });
    return updated;
  }
}
