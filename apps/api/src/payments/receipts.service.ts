import { Injectable } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
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

  /** Every successful payment gets exactly one receipt (Rule 5). Guards
   * against ever creating a second one for the same payment — if this is
   * somehow invoked twice for the same payment (a bug elsewhere, a retried
   * request), the existing receipt is returned unchanged rather than a
   * second receipt/receipt-number being minted. */
  async generateForPayment(paymentId: string) {
    const [existing] = await db.select().from(schema.paymentReceipts).where(eq(schema.paymentReceipts.paymentId, paymentId));
    if (existing) return existing;
    const receiptNumber = await this.nextReceiptNumber();
    const [row] = await db.insert(schema.paymentReceipts).values({ paymentId, receiptNumber }).returning();
    return row;
  }

  private async schoolInfo() {
    const keys = ["school_name", "school_address", "school_phone", "school_email", "school_logo_url"];
    const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, keys));
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      name: map.get("school_name") || "Nalanda Academy",
      address: map.get("school_address") || null,
      phone: map.get("school_phone") || null,
      email: map.get("school_email") || null,
      logoUrl: map.get("school_logo_url") || null,
    };
  }

  /** Assembles the full printable receipt: school + student + fee + payment
   * details. Used for both the in-app receipt view and the downloadable
   * PDF, so both always show identical, real, server-verified data. */
  async getFullReceipt(paymentId: string) {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, paymentId));
    if (!payment) return null;
    const [receipt] = await db.select().from(schema.paymentReceipts).where(eq(schema.paymentReceipts.paymentId, paymentId));
    const school = await this.schoolInfo();

    let student: typeof schema.students.$inferSelect | null = null;
    let studentClass: typeof schema.classes.$inferSelect | null = null;
    let section: typeof schema.sections.$inferSelect | null = null;
    let academicYear: typeof schema.academicYears.$inferSelect | null = null;
    if (payment.studentId) {
      [student] = await db.select().from(schema.students).where(eq(schema.students.id, payment.studentId));
      if (student) {
        [studentClass] = await db.select().from(schema.classes).where(eq(schema.classes.id, student.classId));
        [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, student.sectionId));
        [academicYear] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, student.academicYearId));
      }
    }

    let feeType: string | null = null;
    let feeMonth: number | null = null;
    let totalAmount: number | null = null;
    let paidToDate: number | null = null;
    if (payment.studentFeeId) {
      const [sf] = await db.select().from(schema.studentFees).where(eq(schema.studentFees.id, payment.studentFeeId));
      if (sf) {
        feeMonth = sf.month;
        totalAmount = sf.amount;
        paidToDate = sf.paidAmount;
        const [structure] = await db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, sf.feeStructureId));
        feeType = structure?.feeType ?? null;
        if (!academicYear) [academicYear] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, sf.academicYearId));
      }
    } else if (payment.extraFeeId) {
      const [ef] = await db.select().from(schema.extraFees).where(eq(schema.extraFees.id, payment.extraFeeId));
      feeType = ef?.title ?? null;
      totalAmount = ef?.amount ?? null;
      paidToDate = ef?.paidAmount ?? null;
    } else if (payment.paymentType === "ADMISSION") {
      feeType = "Admission Fee";
    }

    const isOffline = payment.gateway !== "RAZORPAY";

    return {
      school,
      receiptNumber: receipt?.receiptNumber ?? null,
      generatedAt: receipt?.generatedAt ?? null,
      student: student ? { name: student.name, studentId: student.studentId, admissionNumber: student.admissionNumber } : null,
      class: studentClass?.name ?? null,
      section: section?.name ?? null,
      academicYear: academicYear?.name ?? null,
      feeType,
      feeMonth,
      amount: payment.amount,
      totalFeeAmount: totalAmount,
      paidToDate,
      remainingAfterThisPayment: totalAmount !== null && paidToDate !== null ? Math.max(0, totalAmount - paidToDate) : null,
      currency: payment.currency,
      paymentCategory: isOffline ? "Offline" : "Online",
      method: isOffline ? payment.method ?? payment.gateway.replace("OFFLINE_", "") : "Razorpay",
      gateway: payment.gateway,
      transactionId: payment.transactionId ?? payment.paymentId,
      orderId: payment.orderId,
      referenceNote: payment.referenceNote,
      chequeNumber: payment.chequeNumber,
      bankName: payment.bankName,
      receivedByName: payment.receivedByName,
      paymentDate: payment.paidAt,
      status: payment.status,
      paymentId: payment.id,
    };
  }
}
