import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class FeesService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // --- Fee structures --------------------------------------------------------
  listFeeStructures(filters: { academicYearId?: string; classId?: string } = {}) {
    const conditions: SQL[] = [];
    if (filters.academicYearId) conditions.push(eq(schema.feeStructures.academicYearId, filters.academicYearId));
    if (filters.classId) conditions.push(eq(schema.feeStructures.classId, filters.classId));
    return db
      .select()
      .from(schema.feeStructures)
      .where(conditions.length ? and(...conditions) : undefined);
  }

  async createFeeStructure(
    dto: { academicYearId: string; classId: string; feeType: string; amount: number; frequency: string; dueDay?: number; description?: string },
    actorId: string,
  ) {
    const [row] = await db.insert(schema.feeStructures).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "FEE_STRUCTURE_CREATE", entity: "FeeStructure", entityId: row.id });
    return row;
  }

  async updateFeeStructure(id: string, dto: Partial<{ amount: number; active: boolean; description: string; dueDay: number }>, actorId: string) {
    const [existing] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, id));
    if (!existing) throw new NotFoundException("Fee structure not found");
    const [row] = await db
      .update(schema.feeStructures)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.feeStructures.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "FEE_STRUCTURE_UPDATE", entity: "FeeStructure", entityId: id });
    return row;
  }

  /** Generates StudentFee rows for every active student in a class from a
   * MONTHLY fee structure, for a given month/year. Skips students who
   * already have that fee for that month (idempotent). */
  async generateMonthlyFees(feeStructureId: string, month: number, year: number, actorId: string) {
    const [structure] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, feeStructureId));
    if (!structure) throw new NotFoundException("Fee structure not found");

    const students = await db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.classId, structure.classId), eq(schema.students.status, "ACTIVE")));

    const created: (typeof schema.studentFees.$inferSelect)[] = [];
    for (const student of students) {
      const existing = await db
        .select()
        .from(schema.studentFees)
        .where(
          and(
            eq(schema.studentFees.studentId, student.id),
            eq(schema.studentFees.feeStructureId, feeStructureId),
            eq(schema.studentFees.month, month),
            eq(schema.studentFees.year, year),
          ),
        );
      if (existing[0]) continue;

      const [row] = await db
        .insert(schema.studentFees)
        .values({
          studentId: student.id,
          feeStructureId,
          academicYearId: structure.academicYearId,
          month,
          year,
          amount: structure.amount,
          dueDate: `${year}-${String(month).padStart(2, "0")}-${String(structure.dueDay).padStart(2, "0")}`,
        })
        .returning();
      created.push(row);
    }

    await this.auditService.log({
      userId: actorId,
      action: "STUDENT_FEES_GENERATE",
      entity: "StudentFee",
      description: `Generated ${created.length} fee record(s) for ${month}/${year} from structure ${feeStructureId}`,
    });

    return { generated: created.length, skippedExisting: students.length - created.length };
  }

  // --- Student fees ------------------------------------------------------
  async getStudentFees(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const fees = await db.select().from(schema.studentFees).where(eq(schema.studentFees.studentId, studentId)).orderBy(schema.studentFees.dueDate);
    const extras = await db.select().from(schema.extraFees).where(eq(schema.extraFees.studentId, studentId));
    return { monthlyFees: fees, extraFees: extras };
  }

  listAllStudentFees(filters: { status?: string; classId?: string } = {}) {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(schema.studentFees.status, filters.status));
    return db
      .select()
      .from(schema.studentFees)
      .where(conditions.length ? and(...conditions) : undefined);
  }

  // --- Extra fees --------------------------------------------------------
  async createExtraFee(
    dto: { studentId?: string; classId?: string; sectionId?: string; title: string; description?: string; amount: number; dueDate: string },
    actorId: string,
  ) {
    if (!dto.studentId && !dto.classId) {
      throw new NotFoundException("Extra fee must target a student, a class, or a section");
    }

    // Targeting a class/section creates one ExtraFee row per matching active student
    // (so each student's balance and payment status can be tracked individually).
    if (dto.studentId) {
      const [row] = await db.insert(schema.extraFees).values(dto).returning();
      await this.auditService.log({ userId: actorId, action: "EXTRA_FEE_CREATE", entity: "ExtraFee", entityId: row.id });
      return [row];
    }

    const conditions: SQL[] = [eq(schema.students.status, "ACTIVE")];
    if (dto.classId) conditions.push(eq(schema.students.classId, dto.classId));
    if (dto.sectionId) conditions.push(eq(schema.students.sectionId, dto.sectionId));
    const students = await db.select().from(schema.students).where(and(...conditions));

    const rows: (typeof schema.extraFees.$inferSelect)[] = [];
    for (const student of students) {
      const [row] = await db
        .insert(schema.extraFees)
        .values({ ...dto, studentId: student.id })
        .returning();
      rows.push(row);
    }

    await this.auditService.log({
      userId: actorId,
      action: "EXTRA_FEE_CREATE_BULK",
      entity: "ExtraFee",
      description: `Created "${dto.title}" for ${rows.length} student(s)`,
    });
    return rows;
  }

  listExtraFees(filters: { classId?: string; status?: string } = {}) {
    const conditions: SQL[] = [];
    if (filters.classId) conditions.push(eq(schema.extraFees.classId, filters.classId));
    if (filters.status) conditions.push(eq(schema.extraFees.status, filters.status));
    return db
      .select()
      .from(schema.extraFees)
      .where(conditions.length ? and(...conditions) : undefined);
  }
}
