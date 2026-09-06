import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import type { MarkAttendanceDto } from "@nalanda/shared";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /** Returns the class roster for a date, with each student's attendance status
   * (or NOT_MARKED if no row exists yet) — what the teacher's UI renders. */
  async getRosterForDate(classId: string, sectionId: string, date: string, user: AuthenticatedUser) {
    await this.ownershipService.assertTeacherAssignedToClass(classId, sectionId, user);

    const students = await db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.classId, classId), eq(schema.students.sectionId, sectionId), eq(schema.students.status, "ACTIVE")))
      .orderBy(schema.students.rollNumber);

    const existingRows = await db
      .select()
      .from(schema.attendance)
      .where(and(eq(schema.attendance.classId, classId), eq(schema.attendance.sectionId, sectionId), eq(schema.attendance.date, date)));

    const byStudent = new Map(existingRows.map((r) => [r.studentId, r]));

    return students.map((s) => ({
      studentId: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      photoUrl: s.photoUrl,
      status: byStudent.get(s.id)?.status ?? "NOT_MARKED",
      remarks: byStudent.get(s.id)?.remarks ?? null,
    }));
  }

  /** Marks/updates attendance for a batch of students in one class+section+date.
   * Idempotent: re-marking the same student/date/class/section/year updates the
   * existing row (upsert) rather than creating a duplicate — the DB unique
   * index on (studentId,date,classId,sectionId,academicYearId) is the hard
   * backstop against duplicates even under concurrent requests. */
  async mark(dto: MarkAttendanceDto, user: AuthenticatedUser) {
    await this.ownershipService.assertTeacherAssignedToClass(dto.classId, dto.sectionId, user);
    if (user.role !== "TEACHER" && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") throw new ForbiddenException();

    const teacherId =
      user.role === "TEACHER"
        ? user.profileId!
        : (
            await db
              .select()
              .from(schema.teacherClassAssignments)
              .where(and(eq(schema.teacherClassAssignments.classId, dto.classId), eq(schema.teacherClassAssignments.sectionId, dto.sectionId)))
          )[0]?.teacherId;

    if (!teacherId) throw new NotFoundException("No teacher is assigned to this class/section to attribute this attendance to");

    const results: (typeof schema.attendance.$inferSelect)[] = [];
    for (const record of dto.records) {
      const [row] = await db
        .insert(schema.attendance)
        .values({
          studentId: record.studentId,
          teacherId,
          classId: dto.classId,
          sectionId: dto.sectionId,
          academicYearId: dto.academicYearId,
          date: dto.date,
          status: record.status,
          remarks: record.remarks,
        })
        .onConflictDoUpdate({
          target: [
            schema.attendance.studentId,
            schema.attendance.date,
            schema.attendance.classId,
            schema.attendance.sectionId,
            schema.attendance.academicYearId,
          ],
          set: { status: record.status, remarks: record.remarks, teacherId, updatedAt: new Date().toISOString() },
        })
        .returning();
      results.push(row);
    }

    await this.auditService.log({
      userId: user.sub,
      action: "ATTENDANCE_MARK",
      entity: "Attendance",
      description: `Marked attendance for ${dto.records.length} student(s), class/section ${dto.classId}/${dto.sectionId} on ${dto.date}`,
    });

    return results;
  }

  /** Ownership-checked attendance history + computed percentage for one student. */
  async getStudentHistory(studentId: string, user: AuthenticatedUser, opts: { from?: string; to?: string } = {}) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);

    const conditions = [eq(schema.attendance.studentId, studentId)];
    if (opts.from) conditions.push(gte(schema.attendance.date, opts.from));
    if (opts.to) conditions.push(lte(schema.attendance.date, opts.to));

    const rows = await db
      .select()
      .from(schema.attendance)
      .where(and(...conditions))
      .orderBy(schema.attendance.date);

    const total = rows.length;
    const present = rows.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const percentage = total === 0 ? null : Math.round((present / total) * 1000) / 10;

    return {
      records: rows,
      summary: {
        total,
        present: rows.filter((r) => r.status === "PRESENT").length,
        absent: rows.filter((r) => r.status === "ABSENT").length,
        late: rows.filter((r) => r.status === "LATE").length,
        leave: rows.filter((r) => r.status === "LEAVE").length,
        percentage,
      },
    };
  }

  /** Admin/teacher class report for a specific date. */
  async getClassReport(classId: string, sectionId: string, date: string, user: AuthenticatedUser) {
    await this.ownershipService.assertTeacherAssignedToClass(classId, sectionId, user);
    const rows = await db
      .select()
      .from(schema.attendance)
      .where(and(eq(schema.attendance.classId, classId), eq(schema.attendance.sectionId, sectionId), eq(schema.attendance.date, date)));

    const [{ totalStudents }] = await db
      .select({ totalStudents: sql<number>`count(*)` })
      .from(schema.students)
      .where(and(eq(schema.students.classId, classId), eq(schema.students.sectionId, sectionId), eq(schema.students.status, "ACTIVE")));

    return {
      date,
      totalStudents: Number(totalStudents),
      marked: rows.length,
      present: rows.filter((r) => r.status === "PRESENT").length,
      absent: rows.filter((r) => r.status === "ABSENT").length,
      late: rows.filter((r) => r.status === "LATE").length,
      leave: rows.filter((r) => r.status === "LEAVE").length,
      notMarked: Number(totalStudents) - rows.length,
    };
  }
}
