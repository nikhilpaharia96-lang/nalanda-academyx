import { Controller, Get, Injectable, Module, Query, UseGuards } from "@nestjs/common";
import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Injectable()
export class ReportsService {
  async attendanceSummary(filters: { classId?: string; sectionId?: string; from?: string; to?: string }) {
    const conditions: SQL[] = [];
    if (filters.classId) conditions.push(eq(schema.attendance.classId, filters.classId));
    if (filters.sectionId) conditions.push(eq(schema.attendance.sectionId, filters.sectionId));
    if (filters.from) conditions.push(gte(schema.attendance.date, filters.from));
    if (filters.to) conditions.push(lte(schema.attendance.date, filters.to));

    const rows = await db
      .select({ status: schema.attendance.status, count: sql<number>`count(*)` })
      .from(schema.attendance)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(schema.attendance.status);

    const byStatus: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    for (const row of rows) byStatus[row.status] = Number(row.count);
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return { byStatus, total, attendanceRate: total === 0 ? null : Math.round(((byStatus.PRESENT + byStatus.LATE) / total) * 1000) / 10 };
  }

  async feeCollectionSummary(filters: { from?: string; to?: string }) {
    const conditions: SQL[] = [eq(schema.payments.status, "PAID")];
    if (filters.from) conditions.push(gte(schema.payments.paidAt, filters.from));
    if (filters.to) conditions.push(lte(schema.payments.paidAt, filters.to));

    const rows = await db
      .select({ gateway: schema.payments.gateway, count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)` })
      .from(schema.payments)
      .where(and(...conditions))
      .groupBy(schema.payments.gateway);

    const [{ pendingTotal, pendingCount }] = await db
      .select({ pendingTotal: sql<number>`coalesce(sum(${schema.studentFees.amount}), 0)`, pendingCount: sql<number>`count(*)` })
      .from(schema.studentFees)
      .where(sql`${schema.studentFees.status} in ('PENDING','OVERDUE','PARTIALLY_PAID')`);

    return {
      byGateway: rows.map((r) => ({ gateway: r.gateway, count: Number(r.count), total: Number(r.total) })),
      collectedTotal: rows.reduce((sum, r) => sum + Number(r.total), 0),
      pending: { count: Number(pendingCount), total: Number(pendingTotal) },
    };
  }

  async enrollmentSummary() {
    const rows = await db
      .select({ classId: schema.students.classId, count: sql<number>`count(*)` })
      .from(schema.students)
      .where(eq(schema.students.status, "ACTIVE"))
      .groupBy(schema.students.classId);

    const classes = await db.select().from(schema.classes);
    const nameById = new Map(classes.map((c) => [c.id, c.name]));

    return rows.map((r) => ({ classId: r.classId, className: nameById.get(r.classId) ?? "Unknown", students: Number(r.count) }));
  }
}

@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("attendance")
  attendance(@Query("classId") classId?: string, @Query("sectionId") sectionId?: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.reportsService.attendanceSummary({ classId, sectionId, from, to });
  }

  @Get("fees")
  fees(@Query("from") from?: string, @Query("to") to?: string) {
    return this.reportsService.feeCollectionSummary({ from, to });
  }

  @Get("enrollment")
  enrollment() {
    return this.reportsService.enrollmentSummary();
  }
}

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
