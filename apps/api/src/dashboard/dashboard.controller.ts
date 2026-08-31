import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("admin")
  adminStats() {
    return this.dashboardService.getSummary();
  }

  @Get("admin/fee-collection")
  feeCollection(@Query("days") days?: string) {
    const parsed = days ? Number(days) : undefined;
    const safeDays = parsed && Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 90) : 14;
    return this.dashboardService.getFeeCollectionSeries(safeDays);
  }

  @Get("admin/attendance-overview")
  attendanceOverview(@Query("date") date?: string) {
    return this.dashboardService.getAttendanceOverview(date);
  }

  @Get("admin/recent-admissions")
  recentAdmissions(@Query("limit") limit?: string) {
    return this.dashboardService.getRecentAdmissions(limit ? Number(limit) : undefined);
  }

  @Get("admin/recent-payments")
  recentPayments(@Query("limit") limit?: string) {
    return this.dashboardService.getRecentPayments(limit ? Number(limit) : undefined);
  }

  @Get("admin/recent-activities")
  recentActivities(@Query("limit") limit?: string) {
    return this.dashboardService.getRecentActivities(limit ? Number(limit) : undefined);
  }

  @Get("admin/notices")
  latestNotices(@Query("limit") limit?: string) {
    return this.dashboardService.getLatestNotices(limit ? Number(limit) : undefined);
  }
}
