import { Controller, Get, UseGuards } from "@nestjs/common";
import { and, eq, gte, lt, inArray, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  @Get("admin")
  @Roles("SUPER_ADMIN", "ADMIN")
  async adminStats() {
    // "Today" boundaries computed in JS as ISO-8601 date strings and compared
    // with plain >= / < — this works identically against both the SQLite and
    // PostgreSQL dialects this package dispatches between, since `paidAt` is
    // stored as an ISO text column in both schemas and ISO-8601 strings sort
    // lexicographically the same as they do chronologically. The previous
    // version used SQLite's `date('now')`/`date(column)` functions, which do
    // not exist in PostgreSQL and would have thrown a SQL error there.
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const [[students], [teachers], [parents], [pendingFees], [todayCollection]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.students).where(eq(schema.students.status, "ACTIVE")),
      db.select({ count: sql<number>`count(*)` }).from(schema.teachers).where(eq(schema.teachers.status, "ACTIVE")),
      db.select({ count: sql<number>`count(*)` }).from(schema.parents),
      db
        .select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${schema.studentFees.amount}), 0)` })
        .from(schema.studentFees)
        .where(inArray(schema.studentFees.status, ["PENDING", "OVERDUE", "PARTIALLY_PAID"])),
      db
        .select({ total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)` })
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.status, "PAID"),
            gte(schema.payments.paidAt, todayStart.toISOString()),
            lt(schema.payments.paidAt, todayEnd.toISOString()),
          ),
        ),
    ]);

    return {
      students: Number(students.count),
      teachers: Number(teachers.count),
      parents: Number(parents.count),
      pendingFees: { count: Number(pendingFees.count), total: Number(pendingFees.total) },
      todayCollection: Number(todayCollection.total),
    };
  }
}
