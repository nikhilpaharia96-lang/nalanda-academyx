import { Injectable } from "@nestjs/common";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";

/** UTC day boundaries as ISO strings — every date/time column in this schema
 * is stored as ISO-8601 text (see schema.ts header), so plain string
 * >= / < comparisons sort correctly and work identically against both the
 * SQLite and Postgres dialects this package dispatches between. Mirrors the
 * approach already used for `todayCollection` below. */
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

const PENDING_FEE_STATUSES = ["PENDING", "OVERDUE", "PARTIALLY_PAID"] as const;

@Injectable()
export class DashboardService {
  /** Headline summary cards. Every figure is a live aggregate query — no
   * hardcoded or placeholder values. Keeps the original response fields
   * (students/teachers/parents/pendingFees/todayCollection) so any existing
   * caller of GET /dashboard/admin keeps working unchanged, and adds the
   * new fields the richer dashboard needs alongside them. */
  async getSummary() {
    const today = dayBounds(0);
    const thisMonth = monthBounds(0);

    const [
      [totalStudents],
      [activeStudents],
      [totalTeachers],
      [totalParents],
      [totalClasses],
      [pendingFees],
      [todayCollection],
      [monthCollection],
      [totalCollected],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.students),
      db.select({ count: sql<number>`count(*)` }).from(schema.students).where(eq(schema.students.status, "ACTIVE")),
      db.select({ count: sql<number>`count(*)` }).from(schema.teachers).where(eq(schema.teachers.status, "ACTIVE")),
      db.select({ count: sql<number>`count(*)` }).from(schema.parents),
      db.select({ count: sql<number>`count(*)` }).from(schema.classes).where(eq(schema.classes.active, true)),
      db
        .select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${schema.studentFees.amount}), 0)` })
        .from(schema.studentFees)
        .where(inArray(schema.studentFees.status, [...PENDING_FEE_STATUSES])),
      db
        .select({ total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)` })
        .from(schema.payments)
        .where(and(eq(schema.payments.status, "PAID"), gte(schema.payments.paidAt, today.start), lt(schema.payments.paidAt, today.end))),
      db
        .select({ total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)` })
        .from(schema.payments)
        .where(and(eq(schema.payments.status, "PAID"), gte(schema.payments.paidAt, thisMonth.start), lt(schema.payments.paidAt, thisMonth.end))),
      db
        .select({ total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)` })
        .from(schema.payments)
        .where(eq(schema.payments.status, "PAID")),
    ]);

    return {
      students: Number(activeStudents.count), // kept for backward compatibility with existing callers
      teachers: Number(totalTeachers.count), // kept for backward compatibility with existing callers
      parents: Number(totalParents.count),
      pendingFees: { count: Number(pendingFees.count), total: Number(pendingFees.total) },
      todayCollection: Number(todayCollection.total),

      totalStudents: Number(totalStudents.count),
      activeStudents: Number(activeStudents.count),
      totalTeachers: Number(totalTeachers.count),
      totalParents: Number(totalParents.count),
      totalClasses: Number(totalClasses.count),
      totalFeesCollected: Number(totalCollected.total),
      monthCollection: Number(monthCollection.total),
    };
  }

  /** Daily paid-vs-pending collection totals for the trailing `days` days
   * (default 14), oldest first — feeds the Fee Collection Chart. "Pending"
   * for a given day is approximated from student-fee due dates falling on
   * that day (fee records don't carry a paid-on-day breakdown of what was
   * outstanding at that point in time; due date is the closest real signal
   * available without adding new schema). */
  async getFeeCollectionSeries(days = 14) {
    const end = dayBounds(0).end; // exclusive upper bound = start of tomorrow
    const startDate = new Date(dayBounds(0).start);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    const start = startDate.toISOString();

    const paidRows = await db
      .select({ paidAt: schema.payments.paidAt, amount: schema.payments.amount })
      .from(schema.payments)
      .where(and(eq(schema.payments.status, "PAID"), gte(schema.payments.paidAt, start), lt(schema.payments.paidAt, end)));

    const pendingRows = await db
      .select({ dueDate: schema.studentFees.dueDate, amount: schema.studentFees.amount })
      .from(schema.studentFees)
      .where(
        and(
          inArray(schema.studentFees.status, [...PENDING_FEE_STATUSES]),
          gte(schema.studentFees.dueDate, start.slice(0, 10)),
          lt(schema.studentFees.dueDate, end.slice(0, 10)),
        ),
      );

    const paidByDay = new Map<string, number>();
    for (const row of paidRows) {
      const day = (row.paidAt || "").slice(0, 10);
      if (!day) continue;
      paidByDay.set(day, (paidByDay.get(day) || 0) + row.amount);
    }

    const pendingByDay = new Map<string, number>();
    for (const row of pendingRows) {
      const day = row.dueDate.slice(0, 10);
      pendingByDay.set(day, (pendingByDay.get(day) || 0) + row.amount);
    }

    const series: { date: string; paid: number; pending: number }[] = [];
    const cursor = new Date(start);
    for (let i = 0; i < days; i++) {
      const day = cursor.toISOString().slice(0, 10);
      series.push({ date: day, paid: paidByDay.get(day) || 0, pending: pendingByDay.get(day) || 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return series;
  }

  /** School-wide attendance snapshot for a single date (defaults to today).
   * Reuses the same `attendance` table and status buckets as
   * ReportsService.attendanceSummary / AttendanceService.getClassReport, but
   * scoped to the whole school rather than one class/section — a
   * genuinely different aggregation, not duplicated business logic. */
  async getAttendanceOverview(date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const rows = await db
      .select({ status: schema.attendance.status, count: sql<number>`count(*)` })
      .from(schema.attendance)
      .where(eq(schema.attendance.date, targetDate))
      .groupBy(schema.attendance.status);

    const byStatus: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    for (const row of rows) byStatus[row.status] = Number(row.count);
    const marked = Object.values(byStatus).reduce((a, b) => a + b, 0);

    const [{ totalActiveStudents }] = await db
      .select({ totalActiveStudents: sql<number>`count(*)` })
      .from(schema.students)
      .where(eq(schema.students.status, "ACTIVE"));

    return {
      date: targetDate,
      present: byStatus.PRESENT,
      absent: byStatus.ABSENT,
      late: byStatus.LATE,
      leave: byStatus.LEAVE,
      marked,
      totalActiveStudents: Number(totalActiveStudents),
      notMarked: Math.max(Number(totalActiveStudents) - marked, 0),
      attendancePercentage: marked === 0 ? null : Math.round(((byStatus.PRESENT + byStatus.LATE) / marked) * 1000) / 10,
    };
  }

  /** Most recently admitted/enrolled students (real `students` rows, not the
   * pre-enrollment admissions pipeline — see AdmissionsService for that
   * separate workflow). Joined with class/section names for display. */
  async getRecentAdmissions(limit = 8) {
    const rows = await db
      .select({
        id: schema.students.id,
        name: schema.students.name,
        admissionNumber: schema.students.admissionNumber,
        rollNumber: schema.students.rollNumber,
        admissionDate: schema.students.admissionDate,
        status: schema.students.status,
        photoUrl: schema.students.photoUrl,
        className: schema.classes.name,
        sectionName: schema.sections.name,
      })
      .from(schema.students)
      .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .leftJoin(schema.sections, eq(schema.students.sectionId, schema.sections.id))
      .orderBy(desc(schema.students.admissionDate), desc(schema.students.createdAt))
      .limit(limit);

    return rows;
  }

  /** Most recent payments across the whole school (any status), joined with
   * student name for display — reuses the same `payments` table
   * PaymentsService.listPayments queries, just ordered/limited for a
   * dashboard feed instead of a filterable admin list. */
  async getRecentPayments(limit = 8) {
    const rows = await db
      .select({
        id: schema.payments.id,
        amount: schema.payments.amount,
        currency: schema.payments.currency,
        paymentType: schema.payments.paymentType,
        gateway: schema.payments.gateway,
        method: schema.payments.method,
        status: schema.payments.status,
        transactionId: schema.payments.transactionId,
        paymentId: schema.payments.paymentId,
        paidAt: schema.payments.paidAt,
        createdAt: schema.payments.createdAt,
        studentId: schema.payments.studentId,
        studentName: schema.students.name,
      })
      .from(schema.payments)
      .leftJoin(schema.students, eq(schema.payments.studentId, schema.students.id))
      .orderBy(desc(schema.payments.createdAt))
      .limit(limit);

    return rows;
  }

  /** Recent privileged actions across the system, sourced directly from
   * `audit_logs` — every mutating admin/teacher action already writes here
   * via AuditService.log, so this is a read view over existing data, not a
   * new activity-tracking mechanism. */
  async getRecentActivities(limit = 12) {
    const rows = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);

    return rows;
  }

  /** Latest published notices, for the dashboard's "Latest Notices" panel —
   * reuses the same query shape as NoticesService.list(published-only). */
  async getLatestNotices(limit = 5) {
    return db
      .select()
      .from(schema.notices)
      .where(eq(schema.notices.published, true))
      .orderBy(desc(schema.notices.publishedAt))
      .limit(limit);
  }
}
