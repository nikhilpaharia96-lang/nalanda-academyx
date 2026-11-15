import { ForbiddenException } from "@nestjs/common";
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";
import { StudentsService } from "./students/students.service";
import { ParentsService } from "./parents/parents.service";
import { TeachersService } from "./teachers/teachers.service";
import { FeesService } from "./fees/fees.service";
import { ConcessionsService } from "./concessions/concessions.service";
import { PayrollService } from "./payroll/payroll.service";
import { PdfPayslipService } from "./payroll/pdf-payslip.service";
import { OwnershipService } from "./common/ownership.service";
import { AuditService } from "./common/audit.service";
import { admin, assignTeacher, makeBase, makeParent, makeStudent, makeTeacher, parentUser, studentUser, teacherUser } from "./campus.fixtures";

const accountant = { sub: "acc-1", email: "acc@x.test", role: "ACCOUNTANT" as const, profileId: "acc-profile" };

describe("access allow-lists (no role is let through just because it wasn't mentioned)", () => {
  const audit = new AuditService();
  const ownership = new OwnershipService();
  const students = new StudentsService(audit);
  const parents = new ParentsService(audit);
  const teachers = new TeachersService(audit);

  it("student record: accountants are denied; admin, the student, and an assigned teacher are allowed", async () => {
    const base = await makeBase();
    const s = await makeStudent(base);
    const other = await makeStudent(base, "2");
    await assignTeacher(base, base.teacher);

    await expect(students.getByIdForUser(s.id, accountant)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(students.getByIdForUser(s.id, admin)).resolves.toMatchObject({ id: s.id });
    await expect(students.getByIdForUser(s.id, studentUser(s.id))).resolves.toMatchObject({ id: s.id });
    await expect(students.getByIdForUser(other.id, studentUser(s.id))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(students.getByIdForUser(s.id, teacherUser(base.teacher.id))).resolves.toMatchObject({ id: s.id });
    const stranger = await makeTeacher();
    await expect(students.getByIdForUser(s.id, teacherUser(stranger.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("parent details: only admins and the parent themself (students, teachers, accountants are denied)", async () => {
    const base = await makeBase();
    const child = await makeStudent(base);
    const parent = await makeParent(child);
    const otherParent = await makeParent(await makeStudent(base, "2"));

    for (const u of [studentUser(child.id), teacherUser(base.teacher.id), accountant, parentUser(otherParent.id)]) {
      await expect(parents.getByIdForUser(parent.id, u)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(parents.getChildren(parent.id, u)).rejects.toBeInstanceOf(ForbiddenException);
    }
    await expect(parents.getByIdForUser(parent.id, parentUser(parent.id))).resolves.toMatchObject({ id: parent.id });
    await expect(parents.getChildren(parent.id, parentUser(parent.id))).resolves.toHaveLength(1);
    await expect(parents.getByIdForUser(parent.id, admin)).resolves.toBeDefined();
  });

  it("teacher details and class assignments: only admins and that teacher", async () => {
    const base = await makeBase();
    const t = base.teacher;
    const other = await makeTeacher();
    const child = await makeStudent(base);
    const parent = await makeParent(child);
    await assignTeacher(base, t);

    for (const u of [studentUser(child.id), parentUser(parent.id), accountant, teacherUser(other.id)]) {
      await expect(teachers.getByIdForUser(t.id, u)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(teachers.listAssignments(t.id, u)).rejects.toBeInstanceOf(ForbiddenException);
    }
    await expect(teachers.getByIdForUser(t.id, teacherUser(t.id))).resolves.toMatchObject({ id: t.id });
    await expect(teachers.listAssignments(t.id, teacherUser(t.id))).resolves.toHaveLength(1);
    await expect(teachers.listAssignments(t.id, admin)).resolves.toHaveLength(1);
  });

  it("finance ownership: accountants pass only the finance check, never the general one", async () => {
    const base = await makeBase();
    const s = await makeStudent(base);
    await expect(ownership.assertCanAccessStudentFinance(s.id, accountant)).resolves.toBeUndefined();
    await expect(ownership.assertCanAccessStudent(s.id, accountant)).rejects.toBeInstanceOf(ForbiddenException);
    // finance variant doesn't open anything to other roles
    const other = await makeStudent(base, "2");
    await expect(ownership.assertCanAccessStudentFinance(s.id, studentUser(other.id))).rejects.toBeInstanceOf(ForbiddenException);
    const stranger = await makeTeacher();
    await expect(ownership.assertCanAccessStudentFinance(s.id, teacherUser(stranger.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("an accountant can read a student's fee statement and concessions, a stranger teacher cannot", async () => {
    const base = await makeBase();
    const s = await makeStudent(base);
    const fees = new FeesService(audit, ownership);
    const concessions = new ConcessionsService(audit, ownership);
    await expect(fees.getStudentFees(s.id, accountant)).resolves.toBeDefined();
    await expect(concessions.forStudent(s.id, accountant)).resolves.toMatchObject({ grants: [] });
    const stranger = await makeTeacher();
    await expect(fees.getStudentFees(s.id, teacherUser(stranger.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("payroll: accountants see every payslip, teachers only their own PAID ones", async () => {
    const payroll = new PayrollService(audit, new PdfPayslipService());
    const t1 = await makeTeacher();
    const t2 = await makeTeacher();
    const S = { basic: 20000, hra: 0, da: 0, otherAllowances: 0, pfPercent: 0, professionalTax: 0, otherDeductions: 0 };
    for (const t of [t1, t2]) await payroll.upsertStructure(t.id, S, admin.sub);
    await payroll.generate(2, 2023, admin.sub);

    const all = await payroll.list(accountant, { month: 2, year: 2023 });
    expect(all.map((p) => p.teacherId)).toEqual(expect.arrayContaining([t1.id, t2.id]));
    expect(await payroll.list(teacherUser(t1.id), { month: 2, year: 2023 })).toHaveLength(0); // draft hidden from the teacher
    const mine = all.find((p) => p.teacherId === t1.id)!;
    await payroll.markPaid(mine.id, { paidOn: "2023-03-01", paymentMode: "UPI" }, accountant.sub);
    expect((await payroll.list(teacherUser(t1.id), { month: 2, year: 2023 })).map((p) => p.id)).toEqual([mine.id]);
    expect((await payroll.renderPdf(mine.id, accountant)).pdf.length).toBeGreaterThan(1500);
    await expect(payroll.renderPdf(all.find((p) => p.teacherId === t2.id)!.id, teacherUser(t1.id))).rejects.toBeInstanceOf(ForbiddenException);
    // accountants run payroll but cannot read a teacher's own attendance feed
    await expect(payroll.myAttendance(accountant, 2, 2023)).rejects.toBeInstanceOf(ForbiddenException);
    expect(await db.select().from(schema.payslips).where(eq(schema.payslips.id, mine.id))).toHaveLength(1);
  });
});
