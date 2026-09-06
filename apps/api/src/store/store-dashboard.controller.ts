import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { StoreDashboardService } from "./store-dashboard.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("store/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class StoreDashboardController {
  constructor(private readonly dashboardService: StoreDashboardService) {}

  @Get("summary")
  summary() {
    return this.dashboardService.getSummary();
  }

  @Get("recent-orders")
  recentOrders(@Query("limit") limit?: string) {
    return this.dashboardService.recentOrders(limit ? Number(limit) : undefined);
  }

  @Get("top-products")
  topProducts(@Query("limit") limit?: string) {
    return this.dashboardService.topSellingProducts(limit ? Number(limit) : undefined);
  }

  @Get("low-stock")
  lowStock() {
    return this.dashboardService.lowStockAlerts();
  }

  @Get("sales-chart")
  salesChart(@Query("days") days?: string) {
    return this.dashboardService.salesChart(days ? Number(days) : undefined);
  }
}

@Controller("store/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class StoreReportsController {
  constructor(private readonly dashboardService: StoreDashboardService) {}

  @Get("product-sales")
  productSales() {
    return this.dashboardService.productSalesReport();
  }

  @Get("category-sales")
  categorySales() {
    return this.dashboardService.categorySalesReport();
  }

  @Get("student-purchases")
  studentPurchases() {
    return this.dashboardService.studentPurchasesReport();
  }

  @Get("daily-sales")
  dailySales(@Query("days") days?: string) {
    return this.dashboardService.dailySalesReport(days ? Number(days) : undefined);
  }

  @Get("monthly-sales")
  monthlySales(@Query("months") months?: string) {
    return this.dashboardService.monthlySalesReport(months ? Number(months) : undefined);
  }

  @Get("pending-orders")
  pendingOrders() {
    return this.dashboardService.pendingOrdersReport();
  }

  @Get("inventory")
  inventory() {
    return this.dashboardService.inventoryReport();
  }
}
