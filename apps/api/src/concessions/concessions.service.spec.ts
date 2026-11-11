import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";
import { ConcessionsService } from "./concessions.service";
import { FeesService } from "../fees/fees.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeParent, makeStudent, parentUser, studentUser } from "../campus.fixtures";

describe("Fee concessions", () => {
  const audit = new AuditService();
  const ownership = new OwnershipService();
  const concessions = new ConcessionsService(audit, ownership);
  const fees = new FeesService(audit, ownership, concessions);
  const uid = () => Math.random().toString(36).slice(2, 8);

  async function setup(amount = 1000, feeType = "TUITION") {
    const base = await makeBase();
    const student = await makeStudent(base);
    const [structure] = await db.insert(schema.feeStructures).values({
      academicYearId: base.year.id, classId: base.c1.id, feeType, amount, frequency: "MONTHLY", dueDay: 10,
    }).returning();
    return { base, student, structure };
  }
  const scheme = (over: Partial<{ type: string; value: number; feeType: string }> = {}) =>
    concessions.create({ name: `S-${uid()}`, type: "PERCENT", value: 25, ...over }, admin.sub);
  const feeOf = async (studentId: string, structureId: string) =>
    (await db.select().from(schema.studentFees).where(eq(schema.studentFees.studentId, studentId)))
      .filter((f) => f.feeStructureId === structureId);

  it("does nothing to fees for students without a concession (existing behaviour unchanged)", async () => {
    const { student, structure } = await setup();
    await fees.generateFeesForPeriod(structure.id, { month: 4, year: 2026 }, admin.sub);
    const [fee] = await feeOf(student.id, structure.id);
    expect(fee.amount).toBe(1000);
    expect(fee.status).toBe("PENDING");
    expect(await db.select().from(schema.studentFeeConcessions).where(eq(schema.studentFeeConcessions.studentFeeId, fee.id))).toHaveLength(0);
  });

  it("generates a discounted fee for a percentage concession and records the discount", async () => {
    const { base, student, structure } = await setup(1000);
    const rte = await scheme({ value: 25 });
    await concessions.grant({ studentId: student.id, concessionId: rte.id, academicYearId: base.year.id, reason: "Sibling" }, admin.sub);
    await fees.generateFeesForPeriod(structure.id, { month: 4, year: 2026 }, admin.sub);

    const [fee] = await feeOf(student.id, structure.id);
    expect(fee.amount).toBe(750);
    const [rec] = await db.select().from(schema.studentFeeConcessions).where(eq(schema.studentFeeConcessions.studentFeeId, fee.id));
    expect(rec).toMatchObject({ originalAmount: 1000, discountAmount: 250 });
    const report = await concessions.report(base.year.id);
    expect(report.items.find((i) => i.concessionId === rte.id)).toMatchObject({ fees: 1, students: 1, total: 250 });
  });

  it("flat amounts, fee-type filtering and combined concessions behave, and never exceed the fee", async () => {
    const { base, student } = await setup();
    const quoteFor = (type: string, amount: number) => concessions.quote(student.id, base.year.id, type, amount);

    const flat = await scheme({ type: "FLAT", value: 300, feeType: "TUITION" });
    const pct = await scheme({ type: "PERCENT", value: 50 });
    for (const c of [flat, pct]) await concessions.grant({ studentId: student.id, concessionId: c.id, academicYearId: base.year.id, reason: "Test" }, admin.sub);

    // Tuition: 300 flat then 50% of the original 1000 (=500) -> 800 off, net 200.
    expect(await quoteFor("TUITION", 1000)).toMatchObject({ discount: 800, net: 200 });
    // Transport isn't covered by the flat scheme, only the 50%.
    expect(await quoteFor("TRANSPORT", 1000)).toMatchObject({ discount: 500, net: 500 });
    // Discount is capped: a 200 fee can't be reduced below 0.
    expect(await quoteFor("TUITION", 200)).toMatchObject({ discount: 200, net: 0 });
  });

  it("a 100% concession creates the fee as WAIVED with nothing payable", async () => {
    const { base, student, structure } = await setup(1200);
    const full = await scheme({ value: 100 });
    await concessions.grant({ studentId: student.id, concessionId: full.id, academicYearId: base.year.id, reason: "RTE admission" }, admin.sub);
    await fees.generateFeesForPeriod(structure.id, { month: 5, year: 2026 }, admin.sub);
    const [fee] = await feeOf(student.id, structure.id);
    expect(fee).toMatchObject({ amount: 0, status: "WAIVED" });
    expect(fee.waivedReason).toContain("Fee concession");
  });

  it("generating twice stays idempotent and does not double-discount", async () => {
    const { base, student, structure } = await setup(1000);
    const c = await scheme({ value: 10 });
    await concessions.grant({ studentId: student.id, concessionId: c.id, academicYearId: base.year.id, reason: "Staff ward" }, admin.sub);
    await fees.generateFeesForPeriod(structure.id, { month: 6, year: 2026 }, admin.sub);
    const again = await fees.generateFeesForPeriod(structure.id, { month: 6, year: 2026 }, admin.sub);
    expect(again.generated).toBe(0);
    const rows = await feeOf(student.id, structure.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(900);
  });

  it("only applies for the right academic year and stops after revoke or when the scheme is deactivated", async () => {
    const { base, student, structure } = await setup(1000);
    const c = await scheme({ value: 20 });
    const g = await concessions.grant({ studentId: student.id, concessionId: c.id, academicYearId: base.year2.id, reason: "Next year only" }, admin.sub);
    await fees.generateFeesForPeriod(structure.id, { month: 4, year: 2026 }, admin.sub);
    expect((await feeOf(student.id, structure.id))[0].amount).toBe(1000); // wrong year -> no discount

    const g2 = await concessions.grant({ studentId: student.id, concessionId: c.id, academicYearId: base.year.id, reason: "This year" }, admin.sub);
    expect((await concessions.quote(student.id, base.year.id, "TUITION", 1000)).net).toBe(800);
    await concessions.revoke(g2.grant.id, admin.sub);
    expect((await concessions.quote(student.id, base.year.id, "TUITION", 1000)).net).toBe(1000);
    await expect(concessions.revoke(g2.grant.id, admin.sub)).rejects.toBeInstanceOf(NotFoundException);

    await concessions.grant({ studentId: student.id, concessionId: c.id, academicYearId: base.year.id, reason: "Again" }, admin.sub);
    await concessions.update(c.id, { active: false }, admin.sub);
    expect((await concessions.quote(student.id, base.year.id, "TUITION", 1000)).net).toBe(1000);
    expect(g.grant.id).toBeDefined();
  });

  it("applyToExisting discounts only untouched PENDING fees and leaves paid, part-paid and already-discounted ones alone", async () => {
    const { base, student, structure } = await setup(1000);
    for (const m of [1, 2, 3, 4]) await fees.generateFeesForPeriod(structure.id, { month: m, year: 2026 }, admin.sub);
    const rows = (await feeOf(student.id, structure.id)).sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
    await db.update(schema.studentFees).set({ status: "PAID", paidAmount: 1000 }).where(eq(schema.studentFees.id, rows[0].id));
    await db.update(schema.studentFees).set({ status: "PARTIALLY_PAID", paidAmount: 400 }).where(eq(schema.studentFees.id, rows[1].id));

    const c = await scheme({ value: 50 });
    const res = await concessions.grant({ studentId: student.id, concessionId: c.id, academicYearId: base.year.id, reason: "Mid-year scholarship", applyToExisting: true }, admin.sub);
    expect(res).toMatchObject({ applied: 2, skipped: 1 }); // PAID is not counted as skipped; PART-PAID is

    const after = (await feeOf(student.id, structure.id)).sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
    expect(after.map((f) => f.amount)).toEqual([1000, 1000, 500, 500]);
    expect(after[1].paidAmount).toBe(400);

    // Running it again for a second scheme must not touch fees that already carry a discount.
    const c2 = await scheme({ value: 10 });
    const res2 = await concessions.grant({ studentId: student.id, concessionId: c2.id, academicYearId: base.year.id, reason: "Another", applyToExisting: true }, admin.sub);
    expect(res2.applied).toBe(0);
    expect((await feeOf(student.id, structure.id)).map((f) => f.amount).sort()).toEqual([1000, 1000, 500, 500]);
  });

  it("rejects duplicate grants and grants of inactive schemes", async () => {
    const { base, student } = await setup();
    const c = await scheme();
    const dto = { studentId: student.id, concessionId: c.id, academicYearId: base.year.id, reason: "Dup test" };
    await concessions.grant(dto, admin.sub);
    await expect(concessions.grant(dto, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await concessions.update(c.id, { active: false }, admin.sub);
    const other = await makeStudent(base, "7");
    await expect(concessions.grant({ ...dto, studentId: other.id }, admin.sub)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("families can see their own child's concessions but not another student's", async () => {
    const { base, student } = await setup();
    const parent = await makeParent(student);
    const stranger = await makeStudent(base, "9");
    const c = await scheme({ value: 15 });
    await concessions.grant({ studentId: student.id, concessionId: c.id, academicYearId: base.year.id, reason: "Visible" }, admin.sub);

    expect((await concessions.forStudent(student.id, parentUser(parent.id))).grants).toHaveLength(1);
    expect((await concessions.forStudent(student.id, studentUser(student.id))).grants).toHaveLength(1);
    await expect(concessions.forStudent(stranger.id, parentUser(parent.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("validates scheme values", async () => {
    await expect(concessions.update((await scheme({ value: 10 })).id, { value: 150 }, admin.sub)).rejects.toThrow(/100/);
  });
});
