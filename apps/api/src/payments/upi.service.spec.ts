import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { UpiService, normalizeUtr } from "./upi.service";
import { PaymentsService } from "./payments.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeParent, makeStudent, parentUser, studentUser } from "../campus.fixtures";

const payments = new PaymentsService(
  {} as any,
  { generateForPayment: async () => ({}) } as any,
  new AuditService(),
  new OwnershipService(),
  { notify: async () => undefined } as any,
  {} as any,
);
const upi = new UpiService(payments, new OwnershipService(), new AuditService());

let n = 0;
const utr = () => `UTR${Date.now()}${++n}`.slice(0, 16).padEnd(12, "0");

async function setup(amount = 1000) {
  const base = await makeBase();
  const student = await makeStudent(base);
  const [structure] = await db.insert(schema.feeStructures).values({ academicYearId: base.year.id, classId: base.c1.id, feeType: "Tuition", amount, frequency: "MONTHLY" }).returning();
  const [fee] = await db
    .insert(schema.studentFees)
    .values({ studentId: student.id, feeStructureId: structure.id, academicYearId: base.year.id, month: 5, year: 2026, amount, dueDate: "2026-05-10" })
    .returning();
  return { student, fee };
}
const feeRow = async (id: string) => (await db.select().from(schema.studentFees).where(eq(schema.studentFees.id, id)))[0];

describe("UPI UTR auto-approval", () => {
  it("normalizes UTRs (case, spaces)", () => {
    expect(normalizeUtr(" ab12 cd34-ef56 ")).toBe("AB12CD34EF56");
  });

  it("claim first, then admin enters the same UTR + amount -> fee becomes PAID automatically", async () => {
    const { student, fee } = await setup(1000);
    const u = utr();
    const sub = await upi.submitClaim({ studentFeeId: fee.id, utr: u.toLowerCase(), amount: 1000 }, studentUser(student.id));
    expect(sub.claim.status).toBe("PENDING");
    expect(sub.match).toMatchObject({ matched: false, reason: "NO_CREDIT" });

    const res = await upi.addCredit({ utr: u, amount: 1000 }, admin.sub);
    expect(res.match.matched).toBe(true);
    expect((await feeRow(fee.id)).status).toBe("PAID");
    const [claim] = await db.select().from(schema.upiClaims).where(eq(schema.upiClaims.utr, u));
    expect(claim.status).toBe("APPROVED");
    expect(claim.paymentId).toBeTruthy();
  });

  it("admin enters the bank credit first, then the claim auto-approves on submit", async () => {
    const { student, fee } = await setup(500);
    const u = utr();
    const credit = await upi.addCredit({ utr: u, amount: 500 }, admin.sub);
    expect(credit.match).toMatchObject({ matched: false, reason: "NO_CLAIM" });
    const sub = await upi.submitClaim({ studentFeeId: fee.id, utr: u, amount: 500 }, studentUser(student.id));
    expect(sub.match.matched).toBe(true);
    expect(sub.claim.status).toBe("APPROVED");
    expect((await feeRow(fee.id)).status).toBe("PAID");
  });

  it("same UTR but different amount is NOT approved", async () => {
    const { student, fee } = await setup(1000);
    const u = utr();
    await upi.submitClaim({ studentFeeId: fee.id, utr: u, amount: 1000 }, studentUser(student.id));
    const res = await upi.addCredit({ utr: u, amount: 900 }, admin.sub);
    expect(res.match).toMatchObject({ matched: false, reason: "AMOUNT_MISMATCH" });
    expect((await feeRow(fee.id)).status).toBe("PENDING");
  });

  it("partial payment makes the fee PARTIALLY_PAID", async () => {
    const { student, fee } = await setup(1000);
    const u = utr();
    await upi.submitClaim({ studentFeeId: fee.id, utr: u, amount: 400 }, studentUser(student.id));
    await upi.addCredit({ utr: u, amount: 400 }, admin.sub);
    const f = await feeRow(fee.id);
    expect(f.status).toBe("PARTIALLY_PAID");
    expect(f.paidAmount).toBe(400);
  });

  it("a UTR can only be used once, over-payment is refused, and rejected claims never pay", async () => {
    const { student, fee } = await setup(300);
    const u = utr();
    await upi.submitClaim({ studentFeeId: fee.id, utr: u, amount: 300 }, studentUser(student.id));
    await expect(upi.submitClaim({ studentFeeId: fee.id, utr: u, amount: 300 }, studentUser(student.id))).rejects.toBeInstanceOf(ConflictException);
    await expect(upi.addCredit({ utr: "BAD", amount: 1 }, admin.sub)).rejects.toBeInstanceOf(BadRequestException);
    await expect(upi.submitClaim({ studentFeeId: fee.id, utr: utr(), amount: 9999 }, studentUser(student.id))).rejects.toBeInstanceOf(BadRequestException);

    const [claim] = await db.select().from(schema.upiClaims).where(eq(schema.upiClaims.utr, u));
    await upi.reject(claim.id, "Wrong payer", admin.sub);
    const res = await upi.addCredit({ utr: u, amount: 300 }, admin.sub);
    expect(res.match.matched).toBe(false);
    expect((await feeRow(fee.id)).status).toBe("PENDING");
    await expect(upi.addCredit({ utr: u, amount: 300 }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });

  it("a parent can claim only for their own child; a student cannot pay another student's fee", async () => {
    const { student, fee } = await setup(200);
    const other = await setup(200);
    const parent = await makeParent(student);
    await expect(upi.submitClaim({ studentFeeId: fee.id, utr: utr(), amount: 200 }, parentUser(parent.id))).resolves.toBeTruthy();
    await expect(upi.submitClaim({ studentFeeId: other.fee.id, utr: utr(), amount: 200 }, studentUser(student.id))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
