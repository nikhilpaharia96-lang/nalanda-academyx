import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, or, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

type StudentFeeRow = typeof schema.studentFees.$inferSelect;
type ExtraFeeRow = typeof schema.extraFees.$inferSelect;

/** A fee is OVERDUE when its due date has passed and it isn't fully settled
 * yet. This is computed on read (not written back by a cron) so it is
 * always accurate without needing background jobs — every list/report
 * endpoint below runs its rows through this. */
function effectiveStatus(status: string, dueDate: string): string {
  if (status === "PENDING" || status === "PARTIALLY_PAID") {
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return "OVERDUE";
  }
  return status;
}

@Injectable()
export class FeesService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // --- Fee structures --------------------------------------------------------
  listFeeStructures(filters: { academicYearId?: string; classId?: string; sectionId?: string; active?: boolean } = {}) {
    const conditions: SQL[] = [];
    if (filters.academicYearId) conditions.push(eq(schema.feeStructures.academicYearId, filters.academicYearId));
    if (filters.classId) conditions.push(eq(schema.feeStructures.classId, filters.classId));
    if (filters.sectionId) conditions.push(or(eq(schema.feeStructures.sectionId, filters.sectionId), isNull(schema.feeStructures.sectionId))!);
    if (filters.active !== undefined) conditions.push(eq(schema.feeStructures.active, filters.active));
    return db
      .select()
      .from(schema.feeStructures)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(schema.feeStructures.createdAt);
  }

  async createFeeStructure(
    dto: {
      academicYearId: string;
      classId: string;
      sectionId?: string;
      feeType: string;
      amount: number;
      frequency: string;
      dueDay?: number;
      description?: string;
    },
    actorId: string,
  ) {
    if (dto.sectionId) {
      const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, dto.sectionId));
      if (!section) throw new NotFoundException("Section not found");
      if (section.classId !== dto.classId) throw new BadRequestException("Section does not belong to the selected class");
    }
    const [row] = await db.insert(schema.feeStructures).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "FEE_STRUCTURE_CREATE", entity: "FeeStructure", entityId: row.id });
    return row;
  }

  async updateFeeStructure(
    id: string,
    dto: Partial<{ amount: number; active: boolean; description: string; dueDay: number; sectionId: string | null }>,
    actorId: string,
  ) {
    const [existing] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, id));
    if (!existing) throw new NotFoundException("Fee structure not found");
    if (dto.sectionId) {
      const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, dto.sectionId));
      if (!section) throw new NotFoundException("Section not found");
      if (section.classId !== existing.classId) throw new BadRequestException("Section does not belong to this fee structure's class");
    }
    const [row] = await db
      .update(schema.feeStructures)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.feeStructures.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "FEE_STRUCTURE_UPDATE", entity: "FeeStructure", entityId: id });
    return row;
  }

  /** Deletes a fee structure only when it is "safe": no student fee (and by
   * extension, no payment) has ever been generated against it. Structures
   * that are in use must be deactivated instead — this preserves every
   * historical financial record (Rule 9). */
  async deleteFeeStructure(id: string, actorId: string) {
    const [existing] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, id));
    if (!existing) throw new NotFoundException("Fee structure not found");

    const inUse = await db.select({ id: schema.studentFees.id }).from(schema.studentFees).where(eq(schema.studentFees.feeStructureId, id)).limit(1);
    if (inUse.length > 0) {
      throw new BadRequestException(
        "This fee structure has student fee records (and possibly payments) against it and cannot be deleted. Deactivate it instead to stop it from being assigned further.",
      );
    }

    await db.delete(schema.feeStructures).where(eq(schema.feeStructures.id, id));
    await this.auditService.log({ userId: actorId, action: "FEE_STRUCTURE_DELETE", entity: "FeeStructure", entityId: id });
    return { deleted: true };
  }

  /** Generates StudentFee rows for every active student in the structure's
   * class (or, if the structure is section-scoped, just that section) for a
   * given period. Idempotent: students who already have that fee for that
   * period are skipped, so calling this twice (or via a duplicated cron
   * trigger) never creates duplicate fee records. */
  async generateFeesForPeriod(feeStructureId: string, dto: { month?: number; year: number; dueDate?: string }, actorId: string) {
    const [structure] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, feeStructureId));
    if (!structure) throw new NotFoundException("Fee structure not found");
    if (!structure.active) throw new BadRequestException("Cannot generate fees from an inactive fee structure");

    let month: number | null = null;
    let dueDate: string;
    if (structure.frequency === "MONTHLY") {
      if (!dto.month) throw new BadRequestException("month is required to generate a MONTHLY fee");
      month = dto.month;
      dueDate = `${dto.year}-${String(dto.month).padStart(2, "0")}-${String(structure.dueDay).padStart(2, "0")}`;
    } else {
      if (!dto.dueDate) throw new BadRequestException(`A specific dueDate is required to generate a ${structure.frequency} fee`);
      dueDate = dto.dueDate;
    }

    const conditions: SQL[] = [eq(schema.students.classId, structure.classId), eq(schema.students.status, "ACTIVE")];
    if (structure.sectionId) conditions.push(eq(schema.students.sectionId, structure.sectionId));
    const students = await db.select().from(schema.students).where(and(...conditions));

    const created: StudentFeeRow[] = [];
    for (const student of students) {
      const existingConditions = [
        eq(schema.studentFees.studentId, student.id),
        eq(schema.studentFees.feeStructureId, feeStructureId),
        eq(schema.studentFees.year, dto.year),
      ];
      existingConditions.push(month === null ? isNull(schema.studentFees.month) : eq(schema.studentFees.month, month));
      const existing = await db.select().from(schema.studentFees).where(and(...existingConditions));
      if (existing[0]) continue;

      const [row] = await db
        .insert(schema.studentFees)
        .values({
          studentId: student.id,
          feeStructureId,
          academicYearId: structure.academicYearId,
          month,
          year: dto.year,
          amount: structure.amount,
          dueDate,
        })
        .returning();
      created.push(row);
    }

    await this.auditService.log({
      userId: actorId,
      action: "STUDENT_FEES_GENERATE",
      entity: "StudentFee",
      description: `Generated ${created.length} fee record(s) for structure ${feeStructureId} (${month ?? "N/A"}/${dto.year})`,
    });

    return { generated: created.length, skippedExisting: students.length - created.length, totalStudents: students.length };
  }

  // --- Student fees --------------------------------------------------------
  async getStudentFees(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const fees = await db.select().from(schema.studentFees).where(eq(schema.studentFees.studentId, studentId)).orderBy(schema.studentFees.dueDate);
    const extras = await db.select().from(schema.extraFees).where(eq(schema.extraFees.studentId, studentId));

    const structureIds = [...new Set(fees.map((f) => f.feeStructureId))];
    const structures = structureIds.length
      ? await db.select().from(schema.feeStructures).where(inArray(schema.feeStructures.id, structureIds))
      : [];
    const structureById = new Map(structures.map((s) => [s.id, s]));

    return {
      monthlyFees: fees.map((f) => ({
        ...f,
        status: effectiveStatus(f.status, f.dueDate),
        remainingAmount: Math.max(0, f.amount - f.paidAmount),
        feeType: structureById.get(f.feeStructureId)?.feeType ?? null,
        frequency: structureById.get(f.feeStructureId)?.frequency ?? null,
        description: structureById.get(f.feeStructureId)?.description ?? null,
      })),
      extraFees: extras.map((f) => ({
        ...f,
        status: effectiveStatus(f.status, f.dueDate),
        remainingAmount: Math.max(0, f.amount - f.paidAmount),
      })),
    };
  }

  /** The core admin dashboard query (spec: Admin → Student Payment
   * Tracking / Pending Fees). Every row is one student's obligation for one
   * fee, joined with their class/section and the fee's type/frequency, with
   * the remaining balance and an accurate (OVERDUE-aware) status. */
  async adminFeeOverview(filters: {
    academicYearId?: string;
    classId?: string;
    sectionId?: string;
    studentId?: string;
    feeType?: string;
    status?: string;
    unpaidOnly?: boolean;
    dueDateFrom?: string;
    dueDateTo?: string;
  } = {}) {
    const conditions: SQL[] = [];
    if (filters.academicYearId) conditions.push(eq(schema.studentFees.academicYearId, filters.academicYearId));
    if (filters.studentId) conditions.push(eq(schema.studentFees.studentId, filters.studentId));
    if (filters.dueDateFrom) conditions.push(gte(schema.studentFees.dueDate, filters.dueDateFrom));
    if (filters.dueDateTo) conditions.push(lte(schema.studentFees.dueDate, filters.dueDateTo));
    if (filters.unpaidOnly) conditions.push(inArray(schema.studentFees.status, ["PENDING", "PARTIALLY_PAID"]));
    else if (filters.status) conditions.push(eq(schema.studentFees.status, filters.status));

    const rows = await db
      .select({
        fee: schema.studentFees,
        student: schema.students,
        class: schema.classes,
        section: schema.sections,
        structure: schema.feeStructures,
      })
      .from(schema.studentFees)
      .innerJoin(schema.students, eq(schema.studentFees.studentId, schema.students.id))
      .innerJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .innerJoin(schema.sections, eq(schema.students.sectionId, schema.sections.id))
      .innerJoin(schema.feeStructures, eq(schema.studentFees.feeStructureId, schema.feeStructures.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(schema.studentFees.dueDate);

    let filtered = rows;
    if (filters.classId) filtered = filtered.filter((r) => r.student.classId === filters.classId);
    if (filters.sectionId) filtered = filtered.filter((r) => r.student.sectionId === filters.sectionId);
    if (filters.feeType) filtered = filtered.filter((r) => r.structure.feeType === filters.feeType);

    // Attach the most recent successful payment for each fee so the table
    // can show Method / Date / Receipt without N+1 requests from the client.
    const feeIds = filtered.map((r) => r.fee.id);
    const paymentsByFee = feeIds.length
      ? await db.select().from(schema.payments).where(and(inArray(schema.payments.studentFeeId, feeIds), eq(schema.payments.status, "PAID")))
      : [];
    const receiptByPaymentId = new Map(
      (await this.receiptsForPayments(paymentsByFee.map((p) => p.id))).map((r) => [r.paymentId, r]),
    );
    const latestPaymentByFee = new Map<string, typeof schema.payments.$inferSelect>();
    for (const p of paymentsByFee) {
      const current = latestPaymentByFee.get(p.studentFeeId!);
      if (!current || (p.paidAt ?? "") > (current.paidAt ?? "")) latestPaymentByFee.set(p.studentFeeId!, p);
    }

    return filtered.map((r) => {
      const latestPayment = latestPaymentByFee.get(r.fee.id);
      const receipt = latestPayment ? receiptByPaymentId.get(latestPayment.id) : undefined;
      return {
        studentFeeId: r.fee.id,
        student: { id: r.student.id, name: r.student.name, studentId: r.student.studentId, admissionNumber: r.student.admissionNumber },
        class: { id: r.class.id, name: r.class.name },
        section: { id: r.section.id, name: r.section.name },
        feeType: r.structure.feeType,
        frequency: r.structure.frequency,
        amount: r.fee.amount,
        paidAmount: r.fee.paidAmount,
        remainingAmount: Math.max(0, r.fee.amount - r.fee.paidAmount),
        dueDate: r.fee.dueDate,
        status: effectiveStatus(r.fee.status, r.fee.dueDate),
        method: latestPayment?.method ?? latestPayment?.gateway ?? null,
        paymentDate: latestPayment?.paidAt ?? null,
        receiptNumber: receipt?.receiptNumber ?? null,
        paymentId: latestPayment?.id ?? null,
      };
    });
  }

  private async receiptsForPayments(paymentIds: string[]) {
    if (paymentIds.length === 0) return [];
    return db.select().from(schema.paymentReceipts).where(inArray(schema.paymentReceipts.paymentId, paymentIds));
  }

  /** Pending Fees screen: every unpaid/partially-paid obligation, filterable
   * the same way as the overview above. */
  pendingFees(filters: {
    academicYearId?: string;
    classId?: string;
    sectionId?: string;
    studentId?: string;
    feeType?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  } = {}) {
    return this.adminFeeOverview({ ...filters, unpaidOnly: true });
  }

  /** Drill-down for a single fee period: "Class 5 → Section A → Monthly Fee
   * September" — every assigned student split into paid vs unpaid, with
   * amounts. */
  async pendingBreakdown(feeStructureId: string, month: number | undefined, year: number) {
    const [structure] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, feeStructureId));
    if (!structure) throw new NotFoundException("Fee structure not found");

    const conditions: SQL[] = [eq(schema.studentFees.feeStructureId, feeStructureId), eq(schema.studentFees.year, year)];
    conditions.push(month === undefined ? isNull(schema.studentFees.month) : eq(schema.studentFees.month, month));

    const rows = await db
      .select({ fee: schema.studentFees, student: schema.students })
      .from(schema.studentFees)
      .innerJoin(schema.students, eq(schema.studentFees.studentId, schema.students.id))
      .where(and(...conditions));

    const paid = rows.filter((r) => r.fee.status === "PAID" || r.fee.status === "WAIVED");
    const unpaid = rows.filter((r) => r.fee.status !== "PAID" && r.fee.status !== "WAIVED");

    return {
      feeStructure: structure,
      totalStudents: rows.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      totalAmountDue: rows.reduce((sum, r) => sum + r.fee.amount, 0),
      totalAmountPaid: rows.reduce((sum, r) => sum + r.fee.paidAmount, 0),
      paidStudents: paid.map((r) => ({ student: r.student, amountPaid: r.fee.paidAmount, amount: r.fee.amount, status: r.fee.status })),
      unpaidStudents: unpaid.map((r) => ({
        student: r.student,
        amountPaid: r.fee.paidAmount,
        amountRemaining: Math.max(0, r.fee.amount - r.fee.paidAmount),
        amount: r.fee.amount,
        status: effectiveStatus(r.fee.status, r.fee.dueDate),
      })),
    };
  }

  /** Fee Reports → Collection Summary, plus a class/section-wise breakdown. */
  async reportsSummary(filters: { academicYearId?: string; classId?: string; sectionId?: string; feeType?: string; dueDateFrom?: string; dueDateTo?: string } = {}) {
    const rows = await this.adminFeeOverview(filters);

    const totals = rows.reduce(
      (acc, r) => {
        acc.totalExpected += r.amount;
        acc.totalCollected += r.paidAmount;
        if (r.status === "PENDING") acc.totalPending += r.remainingAmount;
        if (r.status === "OVERDUE") acc.totalOverdue += r.remainingAmount;
        if (r.status === "PARTIALLY_PAID") acc.totalPartiallyPaid += r.remainingAmount;
        if (r.status === "WAIVED") acc.totalWaived += r.remainingAmount;
        return acc;
      },
      { totalExpected: 0, totalCollected: 0, totalPending: 0, totalOverdue: 0, totalPartiallyPaid: 0, totalWaived: 0 },
    );

    const byClassSectionMap = new Map<string, { classId: string; className: string; sectionId: string; sectionName: string; expected: number; collected: number; pending: number }>();
    for (const r of rows) {
      const key = `${r.class.id}:${r.section.id}`;
      const entry = byClassSectionMap.get(key) ?? {
        classId: r.class.id,
        className: r.class.name,
        sectionId: r.section.id,
        sectionName: r.section.name,
        expected: 0,
        collected: 0,
        pending: 0,
      };
      entry.expected += r.amount;
      entry.collected += r.paidAmount;
      entry.pending += r.remainingAmount;
      byClassSectionMap.set(key, entry);
    }

    return {
      ...totals,
      byClassSection: [...byClassSectionMap.values()].sort((a, b) => a.className.localeCompare(b.className) || a.sectionName.localeCompare(b.sectionName)),
    };
  }

  /** Marks a fee (fully or partially unpaid) as WAIVED — the remaining
   * balance is written off and the student is no longer asked to pay it.
   * Cannot waive a fee that's already fully paid. */
  async waiveStudentFee(studentFeeId: string, reason: string, actorId: string) {
    const [fee] = await db.select().from(schema.studentFees).where(eq(schema.studentFees.id, studentFeeId));
    if (!fee) throw new NotFoundException("Student fee not found");
    if (fee.status === "PAID") throw new BadRequestException("This fee is already fully paid and cannot be waived");
    if (fee.status === "WAIVED") throw new BadRequestException("This fee has already been waived");

    const [row] = await db
      .update(schema.studentFees)
      .set({ status: "WAIVED", waivedAt: new Date().toISOString(), waivedBy: actorId, waivedReason: reason, updatedAt: new Date().toISOString() })
      .where(eq(schema.studentFees.id, studentFeeId))
      .returning();

    await this.auditService.log({ userId: actorId, action: "FEE_WAIVED", entity: "StudentFee", entityId: studentFeeId, description: reason });
    return row;
  }

  listAllStudentFees(filters: { status?: string; classId?: string } = {}) {
    // Kept for backward compatibility with any existing callers; prefer
    // adminFeeOverview()/pendingFees() for anything user-facing — they carry
    // student/class/section context the raw table can't.
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
      throw new BadRequestException("Extra fee must target a student, a class, or a section");
    }

    if (dto.studentId) {
      const [row] = await db.insert(schema.extraFees).values(dto).returning();
      await this.auditService.log({ userId: actorId, action: "EXTRA_FEE_CREATE", entity: "ExtraFee", entityId: row.id });
      return [row];
    }

    const conditions: SQL[] = [eq(schema.students.status, "ACTIVE")];
    if (dto.classId) conditions.push(eq(schema.students.classId, dto.classId));
    if (dto.sectionId) conditions.push(eq(schema.students.sectionId, dto.sectionId));
    const students = await db.select().from(schema.students).where(and(...conditions));

    const rows: ExtraFeeRow[] = [];
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
