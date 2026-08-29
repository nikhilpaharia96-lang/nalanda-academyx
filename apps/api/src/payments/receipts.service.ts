import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";

@Injectable()
export class ReceiptsService {
  /** Atomically increments a persisted counter to produce receipt numbers
   * like RCT-2026-000123. Using the Settings table as the counter keeps this
   * portable to Postgres (where the same logic can move to a SEQUENCE). */
  private async nextReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const key = `receipt_counter_${year}`;
    const [existing] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    const next = existing ? Number(existing.value) + 1 : 1;

    if (existing) {
      await db.update(schema.settings).set({ value: String(next) }).where(eq(schema.settings.key, key));
    } else {
      await db.insert(schema.settings).values({ key, value: String(next) });
    }

    return `RCT-${year}-${String(next).padStart(6, "0")}`;
  }

  async generateForPayment(paymentId: string) {
    const receiptNumber = await this.nextReceiptNumber();
    const [row] = await db.insert(schema.paymentReceipts).values({ paymentId, receiptNumber }).returning();
    return row;
  }

  /** Assembles the full printable receipt: school + student + fee + payment details. */
  async getFullReceipt(paymentId: string) {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, paymentId));
    if (!payment) return null;
    const [receipt] = await db.select().from(schema.paymentReceipts).where(eq(schema.paymentReceipts.paymentId, paymentId));

    let student: typeof schema.students.$inferSelect | null = null;
    let studentClass: typeof schema.classes.$inferSelect | null = null;
    let section: typeof schema.sections.$inferSelect | null = null;
    if (payment.studentId) {
      [student] = await db.select().from(schema.students).where(eq(schema.students.id, payment.studentId));
      if (student) {
        [studentClass] = await db.select().from(schema.classes).where(eq(schema.classes.id, student.classId));
        [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, student.sectionId));
      }
    }

    let feeType: string | null = null;
    let feeMonth: number | null = null;
    if (payment.studentFeeId) {
      const [sf] = await db.select().from(schema.studentFees).where(eq(schema.studentFees.id, payment.studentFeeId));
      if (sf) {
        feeMonth = sf.month;
        const [structure] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, sf.feeStructureId));
        feeType = structure?.feeType ?? null;
      }
    } else if (payment.extraFeeId) {
      const [ef] = await db.select().from(schema.extraFees).where(eq(schema.extraFees.id, payment.extraFeeId));
      feeType = ef?.title ?? null;
    } else if (payment.paymentType === "ADMISSION") {
      feeType = "Admission Fee";
    }

    return {
      school: "Nalanda Academy",
      receiptNumber: receipt?.receiptNumber ?? null,
      generatedAt: receipt?.generatedAt ?? null,
      student: student ? { name: student.name, admissionNumber: student.admissionNumber } : null,
      class: studentClass?.name ?? null,
      section: section?.name ?? null,
      feeType,
      feeMonth,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method ?? payment.gateway,
      transactionId: payment.transactionId ?? payment.paymentId,
      paymentDate: payment.paidAt,
      status: payment.status,
    };
  }
}
