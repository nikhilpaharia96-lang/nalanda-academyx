import { Injectable } from "@nestjs/common";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { StoreInventoryService } from "./store-inventory.service";

function dayBounds(offsetDays = 0) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + offsetDays);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function monthBounds(offsetMonths = 0) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

// Orders count as real "sales" for dashboard/report purposes once they're
// past PENDING (i.e. paid) — mirrors payments.status === "PAID" everywhere
// else in this codebase.
const SOLD_STATUSES = ["CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "DELIVERED"] as const;

@Injectable()
export class StoreDashboardService {
  constructor(private readonly inventoryService: StoreInventoryService) {}

  async getSummary() {
    const today = dayBounds(0);
    const thisMonth = monthBounds(0);

    const [
      [totalProducts],
      [activeProducts],
      [totalOrders],
      [pendingOrders],
      [todaySales],
      [monthSales],
      [totalRevenue],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.storeProducts),
      db.select({ count: sql<number>`count(*)` }).from(schema.storeProducts).where(eq(schema.storeProducts.status, "ACTIVE")),
      db.select({ count: sql<number>`count(*)` }).from(schema.storeOrders),
      db.select({ count: sql<number>`count(*)` }).from(schema.storeOrders).where(eq(schema.storeOrders.status, "PENDING")),
      db
        .select({ total: sql<number>`coalesce(sum(${schema.storeOrders.totalAmount}), 0)` })
        .from(schema.storeOrders)
        .where(sql`${schema.storeOrders.createdAt} >= ${today.start} and ${schema.storeOrders.createdAt} < ${today.end} and ${schema.storeOrders.status} in ('CONFIRMED','PROCESSING','READY_FOR_COLLECTION','DELIVERED')`),
      db
        .select({ total: sql<number>`coalesce(sum(${schema.storeOrders.totalAmount}), 0)` })
        .from(schema.storeOrders)
        .where(sql`${schema.storeOrders.createdAt} >= ${thisMonth.start} and ${schema.storeOrders.createdAt} < ${thisMonth.end} and ${schema.storeOrders.status} in ('CONFIRMED','PROCESSING','READY_FOR_COLLECTION','DELIVERED')`),
      db
        .select({ total: sql<number>`coalesce(sum(${schema.storeOrders.totalAmount}), 0)` })
        .from(schema.storeOrders)
        .where(inArray(schema.storeOrders.status, [...SOLD_STATUSES])),
    ]);

    const inventory = await this.inventoryService.listInventory();
    const lowStockCount = inventory.filter((r) => r.lowStock).length;

    return {
      totalProducts: Number(totalProducts.count),
      activeProducts: Number(activeProducts.count),
      totalOrders: Number(totalOrders.count),
      pendingOrders: Number(pendingOrders.count),
      todaySales: Number(todaySales.total),
      monthSales: Number(monthSales.total),
      totalRevenue: Number(totalRevenue.total),
      lowStockProducts: lowStockCount,
    };
  }

  async recentOrders(limit = 10) {
    const rows = await db.select().from(schema.storeOrders).orderBy(desc(schema.storeOrders.createdAt)).limit(limit);
    return Promise.all(
      rows.map(async (o) => {
        const [student] = await db.select().from(schema.students).where(eq(schema.students.id, o.studentId));
        return { ...o, studentName: student?.name ?? "Unknown" };
      }),
    );
  }

  async topSellingProducts(limit = 5) {
    const items = await db.select().from(schema.storeOrderItems);
    const orderIds = [...new Set(items.map((i) => i.orderId))];
    const orders = orderIds.length
      ? await db.select().from(schema.storeOrders).where(inArray(schema.storeOrders.id, orderIds))
      : [];
    const paidOrderIds = new Set(orders.filter((o) => (SOLD_STATUSES as readonly string[]).includes(o.status)).map((o) => o.id));

    const totals = new Map<string, { productId: string; name: string; quantitySold: number; revenue: number }>();
    for (const item of items) {
      if (!paidOrderIds.has(item.orderId)) continue;
      const entry = totals.get(item.productId) ?? { productId: item.productId, name: item.productName, quantitySold: 0, revenue: 0 };
      entry.quantitySold += item.quantity;
      entry.revenue += item.lineTotal;
      totals.set(item.productId, entry);
    }
    return [...totals.values()].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, limit);
  }

  async lowStockAlerts() {
    const inventory = await this.inventoryService.listInventory();
    return inventory.filter((r) => r.lowStock);
  }

  async salesChart(days = 14) {
    const points: Array<{ date: string; total: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const { start, end } = dayBounds(-i);
      const [row] = await db
        .select({ total: sql<number>`coalesce(sum(${schema.storeOrders.totalAmount}), 0)` })
        .from(schema.storeOrders)
        .where(sql`${schema.storeOrders.createdAt} >= ${start} and ${schema.storeOrders.createdAt} < ${end} and ${schema.storeOrders.status} in ('CONFIRMED','PROCESSING','READY_FOR_COLLECTION','DELIVERED')`);
      points.push({ date: start.slice(0, 10), total: Number(row.total) });
    }
    return points;
  }

  // -------------------------------------------------------------------
  // REPORTS
  // -------------------------------------------------------------------

  async productSalesReport() {
    return this.topSellingProducts(1000);
  }

  async categorySalesReport() {
    const items = await db.select().from(schema.storeOrderItems);
    const orders = await db.select().from(schema.storeOrders);
    const paidOrderIds = new Set(orders.filter((o) => (SOLD_STATUSES as readonly string[]).includes(o.status)).map((o) => o.id));
    const products = await db.select().from(schema.storeProducts);
    const productById = new Map(products.map((p) => [p.id, p]));
    const categories = await db.select().from(schema.storeCategories);
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const totals = new Map<string, { categoryId: string; categoryName: string; revenue: number; quantitySold: number }>();
    for (const item of items) {
      if (!paidOrderIds.has(item.orderId)) continue;
      const product = productById.get(item.productId);
      if (!product) continue;
      const category = categoryById.get(product.categoryId);
      const key = product.categoryId;
      const entry = totals.get(key) ?? { categoryId: key, categoryName: category?.name ?? "Uncategorized", revenue: 0, quantitySold: 0 };
      entry.revenue += item.lineTotal;
      entry.quantitySold += item.quantity;
      totals.set(key, entry);
    }
    return [...totals.values()].sort((a, b) => b.revenue - a.revenue);
  }

  async studentPurchasesReport() {
    const orders = await db.select().from(schema.storeOrders).where(inArray(schema.storeOrders.status, [...SOLD_STATUSES]));
    const students = await db.select().from(schema.students);
    const studentById = new Map(students.map((s) => [s.id, s]));
    const totals = new Map<string, { studentId: string; studentName: string; orderCount: number; totalSpent: number }>();
    for (const o of orders) {
      const entry = totals.get(o.studentId) ?? { studentId: o.studentId, studentName: studentById.get(o.studentId)?.name ?? "Unknown", orderCount: 0, totalSpent: 0 };
      entry.orderCount += 1;
      entry.totalSpent += o.totalAmount;
      totals.set(o.studentId, entry);
    }
    return [...totals.values()].sort((a, b) => b.totalSpent - a.totalSpent);
  }

  async dailySalesReport(days = 30) {
    return this.salesChart(days);
  }

  async monthlySalesReport(months = 12) {
    const points: Array<{ month: string; total: number }> = [];
    for (let i = months - 1; i >= 0; i--) {
      const { start, end } = monthBounds(-i);
      const [row] = await db
        .select({ total: sql<number>`coalesce(sum(${schema.storeOrders.totalAmount}), 0)` })
        .from(schema.storeOrders)
        .where(sql`${schema.storeOrders.createdAt} >= ${start} and ${schema.storeOrders.createdAt} < ${end} and ${schema.storeOrders.status} in ('CONFIRMED','PROCESSING','READY_FOR_COLLECTION','DELIVERED')`);
      points.push({ month: start.slice(0, 7), total: Number(row.total) });
    }
    return points;
  }

  async pendingOrdersReport() {
    return db.select().from(schema.storeOrders).where(eq(schema.storeOrders.status, "PENDING")).orderBy(desc(schema.storeOrders.createdAt));
  }

  async inventoryReport() {
    return this.inventoryService.listInventory();
  }
}
