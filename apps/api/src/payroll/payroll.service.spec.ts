import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";
import { PayrollService } from "./payroll.service";
import { PdfPayslipService } from "./pdf-payslip.service";
import { AuditService } from "../common/audit.service";
import { admin, makeTeacher, teacherUser } from "../campus.fixtures";

const STRUCT = { basic: 30000, hra: 12000, da: 3000, otherAllowances: 5000, pfPercent: 12, professionalTax: 200, otherDeductions: 0 };
const isPdf = (b: Buffer) => b.subarray(0, 5).toString() === "%PDF-" && b.length > 1500;

describe("PayrollService", () => {
  const service = new PayrollService(new AuditService(), new PdfPayslipService());
  const mine = async (teacherId: string, month: number, year: number) => (await service.list(admin, { month, year, teacherId }))[0];

  it("generates a payslip from the structure and attendance, then stays idempotent", async () => {
    const t = await makeTeacher();
    await service.upsertStructure(t.id, STRUCT, admin.sub);
    // Sept 2024: 2 absent + 1 half day on weekdays, 1 paid leave, and an absent mark on Sunday the 8th (ignored) -> 2.5 LOP days
    await service.markAttendance({ date: "2024-09-02", records: [{ teacherId: t.id, status: "ABSENT" }] }, admin.sub);
    await service.markAttendance({ date: "2024-09-03", records: [{ teacherId: t.id, status: "ABSENT" }] }, admin.sub);
    await service.markAttendance({ date: "2024-09-04", records: [{ teacherId: t.id, status: "HALF_DAY" }] }, admin.sub);
    await service.markAttendance({ date: "2024-09-05", records: [{ teacherId: t.id, status: "LEAVE" }] }, admin.sub);
    await service.markAttendance({ date: "2024-09-08", records: [{ teacherId: t.id, status: "ABSENT" }] }, admin.sub);

    await service.generate(9, 2024, admin.sub);
    const p = await mine(t.id, 9, 2024);
    expect(p).toMatchObject({ workingDays: 25, lopDays: 2.5, grossEarned: 45000, pfAmount: 3240, totalDeductions: 3440, netPay: 41560, status: "GENERATED" });

    const again = await service.generate(9, 2024, admin.sub);
    expect(again.generated).toBe(0);
    expect((await service.list(admin, { month: 9, year: 2024, teacherId: t.id }))).toHaveLength(1);
  });

  it("changing the salary structure later never alters an existing payslip", async () => {
    const t = await makeTeacher();
    await service.upsertStructure(t.id, STRUCT, admin.sub);
    await service.generate(10, 2024, admin.sub);
    const before = await mine(t.id, 10, 2024);
    await service.upsertStructure(t.id, { ...STRUCT, basic: 99000 }, admin.sub);
    expect((await mine(t.id, 10, 2024)).netPay).toBe(before.netPay);
    expect(before.basic).toBe(30000);
  });

  it("charges a mid-month joiner only for days after joining, and skips late joiners and teachers with no structure", async () => {
    const joiner = await makeTeacher();
    const late = await makeTeacher();
    const noStructure = await makeTeacher();
    await db.update(schema.teachers).set({ joiningDate: "2024-09-10" }).where(eq(schema.teachers.id, joiner.id));
    await db.update(schema.teachers).set({ joiningDate: "2024-12-01" }).where(eq(schema.teachers.id, late.id));
    for (const t of [joiner, late]) await service.upsertStructure(t.id, STRUCT, admin.sub);

    const res = await service.generate(9, 2024, admin.sub);
    expect(res.missingStructure).toContain(noStructure.name);
    expect(await mine(late.id, 9, 2024)).toBeUndefined();
    const p = await mine(joiner.id, 9, 2024);
    expect(p.lopDays).toBe(7); // 7 working days before the 10th
    expect(p.grossEarned).toBe(36000); // 50,000 * 18/25
  });

  it("skips inactive teachers", async () => {
    const t = await makeTeacher();
    await service.upsertStructure(t.id, STRUCT, admin.sub);
    await db.update(schema.teachers).set({ status: "INACTIVE" }).where(eq(schema.teachers.id, t.id));
    await service.generate(11, 2024, admin.sub);
    expect(await mine(t.id, 11, 2024)).toBeUndefined();
  });

  it("adjust recomputes from the payslip's own numbers; paid payslips are locked", async () => {
    const t = await makeTeacher();
    await service.upsertStructure(t.id, STRUCT, admin.sub);
    await service.generate(8, 2024, admin.sub);
    const p = await mine(t.id, 8, 2024);

    await expect(service.adjust(p.id, 99, admin.sub)).rejects.toBeInstanceOf(BadRequestException);
    const adj = await service.adjust(p.id, 5, admin.sub);
    expect(adj.lopDays).toBe(5);
    expect(adj.grossEarned).toBeLessThan(p.grossEarned);

    await service.markPaid(p.id, { paidOn: "2024-09-01", paymentMode: "BANK_TRANSFER", paymentReference: "UTR123" }, admin.sub);
    await expect(service.markPaid(p.id, { paidOn: "2024-09-01", paymentMode: "CASH" }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.adjust(p.id, 0, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.remove(p.id, admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });

  it("an unpaid payslip can be deleted and regenerated with a corrected structure", async () => {
    const t = await makeTeacher();
    await service.upsertStructure(t.id, STRUCT, admin.sub);
    await service.generate(7, 2024, admin.sub);
    const p = await mine(t.id, 7, 2024);
    await service.upsertStructure(t.id, { ...STRUCT, basic: 40000 }, admin.sub);
    await service.remove(p.id, admin.sub);
    await service.generate(7, 2024, admin.sub);
    expect((await mine(t.id, 7, 2024)).basic).toBe(40000);
  });

  it("teachers see and download only their own PAID payslips", async () => {
    const t = await makeTeacher();
    const other = await makeTeacher();
    for (const x of [t, other]) await service.upsertStructure(x.id, STRUCT, admin.sub);
    await service.generate(6, 2024, admin.sub);
    const p = await mine(t.id, 6, 2024);
    const o = await mine(other.id, 6, 2024);

    expect(await service.list(teacherUser(t.id))).toHaveLength(0); // draft is hidden
    await expect(service.renderPdf(p.id, teacherUser(t.id))).rejects.toBeInstanceOf(NotFoundException);

    await service.markPaid(p.id, { paidOn: "2024-07-01", paymentMode: "UPI" }, admin.sub);
    expect((await service.list(teacherUser(t.id))).map((x) => x.id)).toEqual([p.id]);
    expect(isPdf((await service.renderPdf(p.id, teacherUser(t.id))).pdf)).toBe(true);

    await service.markPaid(o.id, { paidOn: "2024-07-01", paymentMode: "UPI" }, admin.sub);
    await expect(service.renderPdf(o.id, teacherUser(t.id))).rejects.toBeInstanceOf(ForbiddenException);
    expect(isPdf((await service.renderPdf(o.id, admin)).pdf)).toBe(true);
  });

  it("staff attendance: no future dates, unknown teachers rejected, re-marking updates, unmarked shows null", async () => {
    const t = await makeTeacher();
    await expect(service.markAttendance({ date: "2999-01-01", records: [{ teacherId: t.id, status: "PRESENT" }] }, admin.sub)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.markAttendance({ date: "2024-05-06", records: [{ teacherId: "nope", status: "PRESENT" }] }, admin.sub)).rejects.toBeInstanceOf(NotFoundException);

    expect((await service.attendanceForDate("2024-05-06")).find((r) => r.teacherId === t.id)?.status).toBeNull();
    await service.markAttendance({ date: "2024-05-06", records: [{ teacherId: t.id, status: "ABSENT" }] }, admin.sub);
    await service.markAttendance({ date: "2024-05-06", records: [{ teacherId: t.id, status: "PRESENT", note: "Corrected" }] }, admin.sub);
    expect((await service.attendanceForDate("2024-05-06")).find((r) => r.teacherId === t.id)).toMatchObject({ status: "PRESENT", note: "Corrected" });
    expect((await service.attendanceSummary(5, 2024)).find((r) => r.teacherId === t.id)).toMatchObject({ present: 1, absent: 0 });
    expect(await service.myAttendance(teacherUser(t.id), 5, 2024)).toHaveLength(1);
  });
});
