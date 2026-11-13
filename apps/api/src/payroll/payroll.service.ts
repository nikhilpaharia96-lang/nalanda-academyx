import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { roundMoney } from "../common/money";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { calculatePay, dateStr, daysBeforeJoining, daysInMonth, workingDaysIn, type PayComponents } from "./payroll-calc";
import { PdfPayslipService } from "./pdf-payslip.service";

const isAdmin = (u: AuthenticatedUser) => u.role === "SUPER_ADMIN" || u.role === "ADMIN";
type Payslip = typeof schema.payslips.$inferSelect;

@Injectable()
export class PayrollService {
  constructor(
    private readonly auditService: AuditService,
    private readonly pdf: PdfPayslipService,
  ) {}

  // --- Salary structures -------------------------------------------------------------------------
  /** Every active teacher with their current structure (null if none set yet). */
  async listStructures() {
    const teachers = await db.select().from(schema.teachers).where(eq(schema.teachers.status, "ACTIVE")).orderBy(schema.teachers.name);
    const structures = await db.select().from(schema.salaryStructures);
    const byTeacher = new Map(structures.map((s) => [s.teacherId, s]));
    return teachers.map((t) => ({ teacherId: t.id, name: t.name, employeeId: t.employeeId, designation: t.designation, structure: byTeacher.get(t.id) ?? null }));
  }

  /** Changes apply to payslips generated from now on; existing payslips keep their own numbers. */
  async upsertStructure(teacherId: string, dto: PayComponents, actorId: string) {
    const [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, teacherId));
    if (!teacher) throw new NotFoundException("Teacher not found");
    const [existing] = await db.select().from(schema.salaryStructures).where(eq(schema.salaryStructures.teacherId, teacherId));
    const [row] = existing
      ? await db.update(schema.salaryStructures).set({ ...dto, updatedAt: new Date().toISOString() }).where(eq(schema.salaryStructures.id, existing.id)).returning()
      : await db.insert(schema.salaryStructures).values({ teacherId, ...dto }).returning();
    await this.auditService.log({ userId: actorId, action: existing ? "SALARY_STRUCTURE_UPDATE" : "SALARY_STRUCTURE_CREATE", entity: "SalaryStructure", entityId: row.id });
    return row;
  }

  // --- Staff attendance ------------------------------------------------------------------------------
  async markAttendance(dto: { date: string; records: { teacherId: string; status: string; note?: string }[] }, actorId: string) {
    if (dto.date > new Date().toLocaleDateString("sv")) throw new BadRequestException("Cannot mark attendance for a future date");
    const ids = [...new Set(dto.records.map((r) => r.teacherId))];
    const found = await db.select({ id: schema.teachers.id }).from(schema.teachers).where(inArray(schema.teachers.id, ids));
    if (found.length !== ids.length) throw new NotFoundException("One or more teachers were not found");

    const existing = await db.select().from(schema.staffAttendance).where(and(eq(schema.staffAttendance.date, dto.date), inArray(schema.staffAttendance.teacherId, ids)));
    const have = new Map(existing.map((e) => [e.teacherId, e]));
    const now = new Date().toISOString();
    for (const r of dto.records) {
      const prev = have.get(r.teacherId);
      if (prev) await db.update(schema.staffAttendance).set({ status: r.status, note: r.note ?? null, markedByUserId: actorId, updatedAt: now }).where(eq(schema.staffAttendance.id, prev.id));
      else await db.insert(schema.staffAttendance).values({ teacherId: r.teacherId, date: dto.date, status: r.status, note: r.note ?? null, markedByUserId: actorId });
    }
    await this.auditService.log({ userId: actorId, action: "STAFF_ATTENDANCE_MARK", entity: "StaffAttendance", entityId: dto.date, description: `${dto.records.length} record(s)` });
    return { saved: dto.records.length };
  }

  /** All active teachers with their status on a date (null = not marked). */
  async attendanceForDate(date: string) {
    const teachers = await db.select().from(schema.teachers).where(eq(schema.teachers.status, "ACTIVE")).orderBy(schema.teachers.name);
    const marks = await db.select().from(schema.staffAttendance).where(eq(schema.staffAttendance.date, date));
    const byTeacher = new Map(marks.map((m) => [m.teacherId, m]));
    return teachers.map((t) => ({ teacherId: t.id, name: t.name, employeeId: t.employeeId, status: byTeacher.get(t.id)?.status ?? null, note: byTeacher.get(t.id)?.note ?? null }));
  }

  async attendanceSummary(month: number, year: number) {
    const from = dateStr(year, month, 1), to = dateStr(year, month, daysInMonth(year, month));
    const teachers = await db.select().from(schema.teachers).where(eq(schema.teachers.status, "ACTIVE")).orderBy(schema.teachers.name);
    const marks = await db.select().from(schema.staffAttendance).where(and(gte(schema.staffAttendance.date, from), lte(schema.staffAttendance.date, to)));
    return teachers.map((t) => {
      const mine = marks.filter((m) => m.teacherId === t.id);
      const count = (s: string) => mine.filter((m) => m.status === s).length;
      return { teacherId: t.id, name: t.name, employeeId: t.employeeId, present: count("PRESENT"), absent: count("ABSENT"), halfDay: count("HALF_DAY"), leave: count("LEAVE") };
    });
  }

  /** A teacher's own attendance for a month. */
  async myAttendance(user: AuthenticatedUser, month: number, year: number) {
    if (user.role !== "TEACHER") throw new ForbiddenException();
    return db.select({ date: schema.staffAttendance.date, status: schema.staffAttendance.status, note: schema.staffAttendance.note })
      .from(schema.staffAttendance)
      .where(and(eq(schema.staffAttendance.teacherId, user.profileId!), gte(schema.staffAttendance.date, dateStr(year, month, 1)), lte(schema.staffAttendance.date, dateStr(year, month, daysInMonth(year, month)))))
      .orderBy(schema.staffAttendance.date);
  }

  // --- Payslips -----------------------------------------------------------------------------------------
  /** Loss-of-pay days from attendance: ABSENT = 1, HALF_DAY = 0.5 (Sundays ignored), plus days before joining. LEAVE is paid. */
  private async lopFromAttendance(teacherId: string, joiningDate: string, month: number, year: number): Promise<number> {
    const from = dateStr(year, month, 1), to = dateStr(year, month, daysInMonth(year, month));
    const marks = await db.select().from(schema.staffAttendance).where(and(eq(schema.staffAttendance.teacherId, teacherId), gte(schema.staffAttendance.date, from), lte(schema.staffAttendance.date, to)));
    let lop = 0;
    for (const m of marks) {
      if (m.date < joiningDate) continue; // already counted as "before joining"
      if (new Date(`${m.date}T00:00:00Z`).getUTCDay() === 0) continue;
      lop += m.status === "ABSENT" ? 1 : m.status === "HALF_DAY" ? 0.5 : 0;
    }
    return lop + daysBeforeJoining(year, month, joiningDate);
  }

  /**
   * Creates payslips for every ACTIVE teacher who has a salary structure and had joined by month end.
   * Safe to run again: teachers who already have a payslip for the month are left untouched.
   */
  async generate(month: number, year: number, actorId: string) {
    const monthEnd = dateStr(year, month, daysInMonth(year, month));
    const teachers = await db.select().from(schema.teachers).where(eq(schema.teachers.status, "ACTIVE"));
    const structures = await db.select().from(schema.salaryStructures);
    const sBy = new Map(structures.map((s) => [s.teacherId, s]));
    const existing = await db.select({ teacherId: schema.payslips.teacherId }).from(schema.payslips).where(and(eq(schema.payslips.month, month), eq(schema.payslips.year, year)));
    const done = new Set(existing.map((e) => e.teacherId));
    const workingDays = workingDaysIn(year, month);

    let generated = 0, alreadyHad = 0;
    const missingStructure: string[] = [];
    for (const t of teachers) {
      if (t.joiningDate > monthEnd) continue;
      if (done.has(t.id)) { alreadyHad++; continue; }
      const s = sBy.get(t.id);
      if (!s) { missingStructure.push(t.name); continue; }
      const comps: PayComponents = { basic: s.basic, hra: s.hra, da: s.da, otherAllowances: s.otherAllowances, pfPercent: s.pfPercent, professionalTax: s.professionalTax, otherDeductions: s.otherDeductions };
      const lopDays = Math.min(await this.lopFromAttendance(t.id, t.joiningDate, month, year), workingDays);
      try {
        await db.insert(schema.payslips).values({ teacherId: t.id, month, year, ...comps, workingDays, lopDays, ...calculatePay(comps, workingDays, lopDays), generatedByUserId: actorId });
        generated++;
      } catch (err) {
        if (/unique/i.test(String((err as Error)?.message ?? err))) alreadyHad++; // a parallel run created it
        else throw err;
      }
    }
    await this.auditService.log({ userId: actorId, action: "PAYSLIPS_GENERATE", entity: "Payslip", entityId: `${year}-${month}`, description: `${generated} generated` });
    return { generated, alreadyHad, missingStructure };
  }

  private async getOrThrow(id: string): Promise<Payslip> {
    const [row] = await db.select().from(schema.payslips).where(eq(schema.payslips.id, id));
    if (!row) throw new NotFoundException("Payslip not found");
    return row;
  }

  /** Override loss-of-pay days (e.g. for approved unpaid leave) and recompute from the payslip's own saved components. */
  async adjust(id: string, lopDays: number, actorId: string) {
    const p = await this.getOrThrow(id);
    if (p.status !== "GENERATED") throw new ConflictException("A paid payslip cannot be changed");
    if (lopDays > p.workingDays) throw new BadRequestException(`Loss-of-pay days cannot exceed the ${p.workingDays} working days`);
    const [row] = await db.update(schema.payslips)
      .set({ lopDays, ...calculatePay(p, p.workingDays, lopDays), updatedAt: new Date().toISOString() })
      .where(and(eq(schema.payslips.id, id), eq(schema.payslips.status, "GENERATED")))
      .returning();
    if (!row) throw new ConflictException("Payslip was changed by someone else; please refresh");
    await this.auditService.log({ userId: actorId, action: "PAYSLIP_ADJUST", entity: "Payslip", entityId: id });
    return row;
  }

  async markPaid(id: string, dto: { paidOn: string; paymentMode: string; paymentReference?: string }, actorId: string) {
    const [row] = await db.update(schema.payslips)
      .set({ status: "PAID", paidOn: dto.paidOn, paymentMode: dto.paymentMode, paymentReference: dto.paymentReference ?? null, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.payslips.id, id), eq(schema.payslips.status, "GENERATED")))
      .returning();
    if (!row) {
      await this.getOrThrow(id);
      throw new ConflictException("Payslip is already paid");
    }
    await this.auditService.log({ userId: actorId, action: "PAYSLIP_PAID", entity: "Payslip", entityId: id });
    return row;
  }

  /** Only unpaid payslips can be removed (to regenerate after fixing a structure). */
  async remove(id: string, actorId: string) {
    const [row] = await db.delete(schema.payslips).where(and(eq(schema.payslips.id, id), eq(schema.payslips.status, "GENERATED"))).returning();
    if (!row) {
      await this.getOrThrow(id);
      throw new ConflictException("A paid payslip cannot be deleted");
    }
    await this.auditService.log({ userId: actorId, action: "PAYSLIP_DELETE", entity: "Payslip", entityId: id });
    return { deleted: true };
  }

  /** Admins see all; a teacher sees only their own PAID payslips (drafts stay hidden). */
  async list(user: AuthenticatedUser, f: { month?: number; year?: number; teacherId?: string } = {}) {
    const conds: SQL[] = [];
    if (f.month) conds.push(eq(schema.payslips.month, f.month));
    if (f.year) conds.push(eq(schema.payslips.year, f.year));
    if (isAdmin(user)) { if (f.teacherId) conds.push(eq(schema.payslips.teacherId, f.teacherId)); }
    else if (user.role === "TEACHER") conds.push(eq(schema.payslips.teacherId, user.profileId!), eq(schema.payslips.status, "PAID"));
    else throw new ForbiddenException();

    return db.select({ p: schema.payslips, name: schema.teachers.name, employeeId: schema.teachers.employeeId })
      .from(schema.payslips)
      .innerJoin(schema.teachers, eq(schema.teachers.id, schema.payslips.teacherId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.payslips.year), desc(schema.payslips.month), schema.teachers.name)
      .limit(500)
      .then((rows) => rows.map((r) => ({ ...r.p, teacherName: r.name, employeeId: r.employeeId })));
  }

  async renderPdf(id: string, user: AuthenticatedUser): Promise<{ pdf: Buffer; filename: string }> {
    const p = await this.getOrThrow(id);
    if (!isAdmin(user)) {
      if (user.role !== "TEACHER" || p.teacherId !== user.profileId) throw new ForbiddenException();
      if (p.status !== "PAID") throw new NotFoundException("Payslip not found");
    }
    const [t] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, p.teacherId));
    const settings = await db.select().from(schema.settings).where(inArray(schema.settings.key, ["school_name", "school_address", "school_phone"]));
    const m = new Map(settings.map((s) => [s.key, s.value]));
    const pdf = await this.pdf.render({
      school: { name: m.get("school_name") || "Nalanda Academy", address: m.get("school_address") || null, phone: m.get("school_phone") || null },
      teacher: { name: t.name, employeeId: t.employeeId, designation: t.designation, department: t.department, joiningDate: t.joiningDate },
      ...p,
    });
    return { pdf, filename: `payslip-${t.employeeId}-${p.year}-${String(p.month).padStart(2, "0")}.pdf` };
  }
}
