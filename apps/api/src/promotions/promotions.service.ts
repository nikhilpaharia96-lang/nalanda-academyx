import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import type { PromoteDto } from "@nalanda/shared";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { toFriendlyConflictError } from "../common/db-errors";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

export interface PromotionResult {
  studentId: string;
  ok: boolean;
  outcome?: string;
  rollNumber?: string;
  error?: string;
}

@Injectable()
export class PromotionsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /** Active students of a class/section in the year being closed — the roster the admin reviews. */
  listCandidates(classId: string, sectionId: string, academicYearId: string) {
    return db
      .select({
        id: schema.students.id,
        name: schema.students.name,
        rollNumber: schema.students.rollNumber,
        studentId: schema.students.studentId,
      })
      .from(schema.students)
      .where(
        and(
          eq(schema.students.classId, classId),
          eq(schema.students.sectionId, sectionId),
          eq(schema.students.academicYearId, academicYearId),
          eq(schema.students.status, "ACTIVE"),
        ),
      )
      .orderBy(schema.students.rollNumber);
  }

  /**
   * Promotes / repeats / graduates a batch. Each student is handled independently so one bad row
   * doesn't block the rest; the response says exactly what happened to each. A student can only be
   * processed while still in `fromAcademicYearId`, so re-submitting the same batch is harmless.
   */
  async promote(dto: PromoteDto, actorId: string): Promise<{ results: PromotionResult[]; succeeded: number; failed: number }> {
    const [toYear] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, dto.toAcademicYearId));
    if (!toYear) throw new NotFoundException("Target academic year not found");
    const [fromYear] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, dto.fromAcademicYearId));
    if (!fromYear) throw new NotFoundException("Source academic year not found");

    const results: PromotionResult[] = [];
    for (const item of dto.items) {
      results.push(await this.promoteOne(item, dto, actorId));
    }
    const succeeded = results.filter((r) => r.ok).length;
    return { results, succeeded, failed: results.length - succeeded };
  }

  private async promoteOne(item: PromoteDto["items"][number], dto: PromoteDto, actorId: string): Promise<PromotionResult> {
    try {
      const [student] = await db.select().from(schema.students).where(eq(schema.students.id, item.studentId));
      if (!student) return { studentId: item.studentId, ok: false, error: "Student not found" };
      if (student.status !== "ACTIVE") return { studentId: item.studentId, ok: false, error: `Student is ${student.status}` };
      if (student.academicYearId !== dto.fromAcademicYearId) {
        return { studentId: item.studentId, ok: false, error: "Student is not in the source academic year (already processed?)" };
      }

      const now = new Date().toISOString();
      const base = {
        studentId: student.id,
        fromClassId: student.classId,
        fromSectionId: student.sectionId,
        fromAcademicYearId: student.academicYearId,
        outcome: item.outcome,
        promotedBy: actorId,
      };

      if (item.outcome === "GRADUATED") {
        await db.update(schema.students).set({ status: "GRADUATED", updatedAt: now }).where(eq(schema.students.id, student.id));
        await db.insert(schema.promotions).values(base);
        await this.auditService.log({ userId: actorId, action: "STUDENT_GRADUATE", entity: "Student", entityId: student.id });
        return { studentId: student.id, ok: true, outcome: "GRADUATED" };
      }

      // PROMOTED needs an explicit destination; REPEATED stays in the same class/section.
      let toClassId = student.classId;
      let toSectionId = student.sectionId;
      if (item.outcome === "PROMOTED") {
        if (!item.toClassId || !item.toSectionId) {
          return { studentId: student.id, ok: false, error: "toClassId and toSectionId are required to promote" };
        }
        if (item.toClassId === student.classId) {
          return { studentId: student.id, ok: false, error: "Destination class equals current class; use REPEATED instead" };
        }
        const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, item.toSectionId));
        if (!section || section.classId !== item.toClassId) {
          return { studentId: student.id, ok: false, error: "Destination section does not belong to destination class" };
        }
        toClassId = item.toClassId;
        toSectionId = item.toSectionId;
      }

      const rollNumber = item.rollNumber ?? (await this.nextRoll(toClassId, toSectionId, dto.toAcademicYearId, student.rollNumber));

      await db
        .update(schema.students)
        .set({ classId: toClassId, sectionId: toSectionId, academicYearId: dto.toAcademicYearId, rollNumber, updatedAt: now })
        .where(eq(schema.students.id, student.id));
      await db.insert(schema.promotions).values({
        ...base,
        toClassId,
        toSectionId,
        toAcademicYearId: dto.toAcademicYearId,
      });
      await this.auditService.log({
        userId: actorId,
        action: item.outcome === "PROMOTED" ? "STUDENT_PROMOTE" : "STUDENT_REPEAT",
        entity: "Student",
        entityId: student.id,
      });
      return { studentId: student.id, ok: true, outcome: item.outcome, rollNumber };
    } catch (err) {
      const friendly = toFriendlyConflictError(err, "roll number in the destination class");
      return { studentId: item.studentId, ok: false, error: friendly instanceof Error ? friendly.message : "Unexpected error" };
    }
  }

  /** Keeps the student's existing roll if free in the destination, otherwise max numeric roll + 1. */
  private async nextRoll(classId: string, sectionId: string, academicYearId: string, preferred: string) {
    const rows = await db
      .select({ rollNumber: schema.students.rollNumber })
      .from(schema.students)
      .where(
        and(
          eq(schema.students.classId, classId),
          eq(schema.students.sectionId, sectionId),
          eq(schema.students.academicYearId, academicYearId),
        ),
      );
    const taken = new Set(rows.map((r) => r.rollNumber));
    if (!taken.has(preferred)) return preferred;
    const max = rows.reduce((m, r) => (Number.isFinite(Number(r.rollNumber)) ? Math.max(m, Number(r.rollNumber)) : m), 0);
    return String(max + 1);
  }

  async history(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    return db
      .select()
      .from(schema.promotions)
      .where(eq(schema.promotions.studentId, studentId))
      .orderBy(schema.promotions.createdAt);
  }
}
