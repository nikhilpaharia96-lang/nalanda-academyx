import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { RazorpayService } from "./razorpay.service";
import { ReceiptsService } from "./receipts.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import type { CreateRazorpayOrderDto, RecordOfflinePaymentDto } from "@nalanda/shared";

// Floating point currency (see schema.pg.ts header note) needs a small
// epsilon when comparing "did they pay the full remaining balance".
const AMOUNT_EPSILON = 0.01;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly receiptsService: ReceiptsService,
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveContext(dto: { studentFeeId?: string; extraFeeId?: string; admissionApplicationId?: string }) {
    if (dto.studentFeeId) {
      const [fee] = await db.select().from(schema.studentFees).where(eq(schema.studentFees.id, dto.studentFeeId));
      if (!fee) throw new NotFoundException("Student fee not found");
      if (fee.status === "WAIVED") throw new BadRequestException("This fee has been waived and cannot be paid");
      const remainingAmount = Math.max(0, fee.amount - fee.paidAmount);
      if (remainingAmount <= AMOUNT_EPSILON) throw new BadRequestException("This fee has already been paid in full");
      return { studentId: fee.studentId, paymentType: "MONTHLY_FEE" as const, remainingAmount, record: fee };
    }
    if (dto.extraFeeId) {
      const [fee] = await db.select().from(schema.extraFees).where(eq(schema.extraFees.id, dto.extraFeeId));
      if (!fee) throw new NotFoundException("Extra fee not found");
      if (fee.status === "WAIVED") throw new BadRequestException("This fee has been waived and cannot be paid");
      const remainingAmount = Math.max(0, fee.amount - fee.paidAmount);
      if (remainingAmount <= AMOUNT_EPSILON) throw new BadRequestException("This fee has already been paid in full");
      return { studentId: fee.studentId ?? undefined, paymentType: "EXTRA_FEE" as const, remainingAmount, record: fee };
    }
    if (dto.admissionApplicationId) {
      const [app] = await db.select().from(schema.admissionApplications).where(eq(schema.admissionApplications.id, dto.admissionApplicationId));
      if (!app) throw new NotFoundException("Admission application not found");
      return { studentId: undefined, paymentType: "ADMISSION" as const, remainingAmount: undefined, record: undefined };
    }
    return { studentId: undefined, paymentType: "OTHER" as const, remainingAmount: undefined, record: undefined };
  }

  async createRazorpayOrder(dto: CreateRazorpayOrderDto, user: AuthenticatedUser) {
    const ctx = await this.resolveContext(dto);
    if (ctx.studentId) await this.ownershipService.assertCanAccessStudent(ctx.studentId, user);
    if (dto.amount <= 0) throw new BadRequestException("Amount must be greater than zero");
    // Never trust a client-supplied amount over what the fee record says —
    // the client may request paying less than the full balance (a partial
    // payment) but never more than what is actually owed.
    if (ctx.remainingAmount !== undefined && dto.amount > ctx.remainingAmount + AMOUNT_EPSILON) {
      throw new BadRequestException(
        `Payment amount (₹${dto.amount}) exceeds the remaining balance for this fee (₹${ctx.remainingAmount.toFixed(2)})`,
      );
    }

    const [payment] = await db
      .insert(schema.payments)
      .values({
        studentId: ctx.studentId,
        studentFeeId: dto.studentFeeId,
        extraFeeId: dto.extraFeeId,
        admissionApplicationId: dto.admissionApplicationId,
        amount: dto.amount,
        paymentType: ctx.paymentType,
        gateway: "RAZORPAY",
        status: "PENDING",
      })
      .returning();

    let order;
    try {
      order = await this.razorpayService.createOrder(Math.round(dto.amount * 100), "INR", payment.id);
    } catch (err) {
      await db.update(schema.payments).set({ status: "FAILED" }).where(eq(schema.payments.id, payment.id));
      throw err;
    }

    await db.update(schema.payments).set({ orderId: order.id }).where(eq(schema.payments.id, payment.id));

    return {
      paymentRecordId: payment.id,
      orderId: order.id,
      amount: dto.amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  /** Server-side signature verification — the ONLY thing that marks a
   * payment PAID. The frontend's "payment succeeded" callback is never
   * trusted on its own. Idempotent: re-posting the same verified payment
   * returns the existing PAID record instead of double-processing. */
  async verifyRazorpayPayment(dto: {
    paymentRecordId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, dto.paymentRecordId));
    if (!payment) throw new NotFoundException("Payment record not found");

    if (payment.status === "PAID") {
      return { alreadyProcessed: true, payment };
    }

    if (payment.orderId !== dto.razorpay_order_id) {
      throw new BadRequestException("Order id does not match this payment record");
    }

    const valid = this.razorpayService.verifyPaymentSignature(dto.razorpay_order_id, dto.razorpay_payment_id, dto.razorpay_signature);
    if (!valid) {
      await db.update(schema.payments).set({ status: "FAILED" }).where(eq(schema.payments.id, payment.id));
      throw new BadRequestException("Payment signature verification failed. No fee has been marked as paid.");
    }

    return this.finalizePayment(payment.id, {
      paymentId: dto.razorpay_payment_id,
      transactionId: dto.razorpay_payment_id,
      method: "razorpay",
    });
  }

  /** Idempotent webhook handler for the `payment.captured` / `payment.failed`
   * events. This is the source of truth Razorpay itself trusts — it runs
   * independently of (and as a safety net for) the checkout-callback verify
   * flow above, so a payment is still correctly recorded even if the user
   * closes their browser right after paying. */
  async handleWebhook(rawBody: string, signature: string) {
    const valid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!valid) throw new BadRequestException("Invalid webhook signature");

    const event = JSON.parse(rawBody);

    if (event.event === "payment.failed") {
      const orderId = event.payload?.payment?.entity?.order_id;
      if (!orderId) return { ignored: true };
      const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId));
      if (!payment || payment.status === "PAID") return { alreadyProcessed: true };
      await db.update(schema.payments).set({ status: "FAILED", updatedAt: new Date().toISOString() }).where(eq(schema.payments.id, payment.id));
      return { processed: true, status: "FAILED" };
    }

    if (event.event !== "payment.captured") return { ignored: true };

    const razorpayOrderId = event.payload?.payment?.entity?.order_id;
    const razorpayPaymentId = event.payload?.payment?.entity?.id;
    if (!razorpayOrderId || !razorpayPaymentId) return { ignored: true };

    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, razorpayOrderId));
    // Idempotency guard: a payment already marked PAID (e.g. by the
    // checkout-callback verify call racing this webhook) is left untouched
    // — this is what prevents a duplicate Razorpay webhook delivery (or a
    // near-simultaneous verify+webhook pair) from double-crediting a fee.
    if (!payment || payment.status === "PAID") return { alreadyProcessed: true };

    await this.finalizePayment(payment.id, { paymentId: razorpayPaymentId, transactionId: razorpayPaymentId, method: "razorpay" });
    return { processed: true };
  }

  private async finalizePayment(paymentId: string, gatewayInfo: { paymentId: string; transactionId: string; method: string }) {
    const [payment] = await db
      .update(schema.payments)
      .set({
        status: "PAID",
        paymentId: gatewayInfo.paymentId,
        transactionId: gatewayInfo.transactionId,
        method: gatewayInfo.method,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.payments.id, paymentId))
      .returning();

    await this.allocatePaymentToFee(payment);
    const receipt = await this.receiptsService.generateForPayment(payment.id);
    await this.notifyPaymentSuccess(payment);

    await this.auditService.log({ action: "PAYMENT_VERIFIED", entity: "Payment", entityId: payment.id, description: `Amount ${payment.amount}` });

    return { payment, receipt };
  }

  /** Recomputes a fee's paidAmount from the sum of every PAID payment that
   * references it (rather than blindly incrementing), then derives status
   * from that sum. This is what makes partial payments correct: a fee
   * naturally becomes PARTIALLY_PAID after a partial payment, and PAID once
   * cumulative payments cover the full amount — and it is safe to re-run
   * (e.g. if this were ever called twice for the same payment) because it
   * always recomputes from source rather than adding on top of itself. */
  private async allocatePaymentToFee(payment: typeof schema.payments.$inferSelect) {
    if (payment.studentFeeId) {
      const paid = await db
        .select()
        .from(schema.payments)
        .where(and(eq(schema.payments.studentFeeId, payment.studentFeeId), eq(schema.payments.status, "PAID")));
      const paidAmount = paid.reduce((sum, p) => sum + p.amount, 0);
      const [fee] = await db.select().from(schema.studentFees).where(eq(schema.studentFees.id, payment.studentFeeId));
      if (fee) {
        const status = paidAmount + AMOUNT_EPSILON >= fee.amount ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING";
        await db
          .update(schema.studentFees)
          .set({ paidAmount, status, updatedAt: new Date().toISOString() })
          .where(eq(schema.studentFees.id, payment.studentFeeId));
      }
    }
    if (payment.extraFeeId) {
      const paid = await db
        .select()
        .from(schema.payments)
        .where(and(eq(schema.payments.extraFeeId, payment.extraFeeId), eq(schema.payments.status, "PAID")));
      const paidAmount = paid.reduce((sum, p) => sum + p.amount, 0);
      const [fee] = await db.select().from(schema.extraFees).where(eq(schema.extraFees.id, payment.extraFeeId));
      if (fee) {
        const status = paidAmount + AMOUNT_EPSILON >= fee.amount ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING";
        await db
          .update(schema.extraFees)
          .set({ paidAmount, status, updatedAt: new Date().toISOString() })
          .where(eq(schema.extraFees.id, payment.extraFeeId));
      }
    }
    if (payment.admissionApplicationId) {
      await db.update(schema.admissionApplications).set({ paymentStatus: "PAID", updatedAt: new Date().toISOString() }).where(eq(schema.admissionApplications.id, payment.admissionApplicationId));
    }
  }

  private async notifyPaymentSuccess(payment: typeof schema.payments.$inferSelect) {
    if (!payment.studentId) return;
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, payment.studentId));
    if (!student) return;
    await this.notificationsService.notify(
      student.userId,
      "Payment received",
      `Your payment of ₹${payment.amount} was received successfully.`,
      "PAYMENT",
    );
  }

  /** Admin manually records a payment collected outside Razorpay (cash, UPI,
   * bank transfer, cheque). Recorded as PAID immediately — the money has
   * already changed hands by the time an admin is data-entering this. */
  async recordOfflinePayment(dto: RecordOfflinePaymentDto, actorId: string) {
    const ctx = await this.resolveContext(dto);
    if (ctx.studentId && ctx.studentId !== dto.studentId) {
      throw new BadRequestException("The selected fee does not belong to the selected student");
    }
    if (dto.amount <= 0) throw new BadRequestException("Amount must be greater than zero");
    if (ctx.remainingAmount !== undefined && dto.amount > ctx.remainingAmount + AMOUNT_EPSILON) {
      throw new BadRequestException(
        `Amount received (₹${dto.amount}) exceeds the remaining balance for this fee (₹${ctx.remainingAmount.toFixed(2)})`,
      );
    }
    if (dto.gateway === "OFFLINE_CHEQUE" && !dto.chequeNumber?.trim()) {
      throw new BadRequestException("A cheque number is required for cheque payments");
    }
    if ((dto.gateway === "OFFLINE_UPI" || dto.gateway === "OFFLINE_BANK_TRANSFER") && !dto.referenceNote?.trim()) {
      throw new BadRequestException("A transaction/reference number is required for UPI and bank transfer payments");
    }

    const [actor] = await db.select().from(schema.users).where(eq(schema.users.id, actorId));

    const [payment] = await db
      .insert(schema.payments)
      .values({
        studentId: dto.studentId,
        studentFeeId: dto.studentFeeId,
        extraFeeId: dto.extraFeeId,
        amount: dto.amount,
        paymentType: ctx.paymentType,
        gateway: dto.gateway,
        status: "PAID",
        method: dto.gateway.replace("OFFLINE_", "").toLowerCase(),
        collectedBy: actorId,
        receivedByName: dto.receivedByName?.trim() || actor?.email || undefined,
        referenceNote: dto.referenceNote,
        chequeNumber: dto.gateway === "OFFLINE_CHEQUE" ? dto.chequeNumber : undefined,
        bankName: dto.bankName,
        paidAt: dto.paidAt || new Date().toISOString(),
      })
      .returning();

    await this.allocatePaymentToFee(payment);
    const receipt = await this.receiptsService.generateForPayment(payment.id);
    await this.notifyPaymentSuccess(payment);
    await this.auditService.log({
      userId: actorId,
      action: "PAYMENT_OFFLINE_RECORD",
      entity: "Payment",
      entityId: payment.id,
      description: `Offline payment of ₹${payment.amount} via ${dto.gateway}`,
    });

    return { payment, receipt };
  }

  async getReceipt(paymentId: string, user: AuthenticatedUser) {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, paymentId));
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status !== "PAID") throw new BadRequestException("A receipt is only available for successful payments");
    if (payment.studentId) await this.ownershipService.assertCanAccessStudent(payment.studentId, user);
    const receipt = await this.receiptsService.getFullReceipt(paymentId);
    if (!receipt) throw new NotFoundException("Receipt not found");
    return receipt;
  }

  listPayments(filters: { status?: string; studentId?: string } = {}) {
    if (filters.studentId) return db.select().from(schema.payments).where(eq(schema.payments.studentId, filters.studentId));
    if (filters.status) return db.select().from(schema.payments).where(eq(schema.payments.status, filters.status));
    return db.select().from(schema.payments);
  }

  /** Admin "Payments / Received Payments" and "Receipts" screens — every
   * payment joined with student/class/section context and its receipt
   * number, with the full filter set the spec calls for. `onlyPaid` narrows
   * this to successful payments only (used by the Receipts screen, where an
   * unsuccessful attempt has nothing to show). */
  async adminListPayments(
    filters: {
      status?: string;
      method?: string;
      studentId?: string;
      classId?: string;
      sectionId?: string;
      feeType?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      onlyPaid?: boolean;
    } = {},
  ) {
    const conditions: SQL[] = [];
    if (filters.onlyPaid) conditions.push(eq(schema.payments.status, "PAID"));
    else if (filters.status) conditions.push(eq(schema.payments.status, filters.status));
    if (filters.studentId) conditions.push(eq(schema.payments.studentId, filters.studentId));
    if (filters.method) conditions.push(eq(schema.payments.gateway, filters.method));
    if (filters.dateFrom) conditions.push(gte(schema.payments.createdAt, filters.dateFrom));
    if (filters.dateTo) conditions.push(lte(schema.payments.createdAt, `${filters.dateTo}T23:59:59.999Z`));

    const rows = await db
      .select({
        payment: schema.payments,
        student: schema.students,
        class: schema.classes,
        section: schema.sections,
        studentFee: schema.studentFees,
        extraFee: schema.extraFees,
        receipt: schema.paymentReceipts,
      })
      .from(schema.payments)
      .leftJoin(schema.students, eq(schema.payments.studentId, schema.students.id))
      .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .leftJoin(schema.sections, eq(schema.students.sectionId, schema.sections.id))
      .leftJoin(schema.studentFees, eq(schema.payments.studentFeeId, schema.studentFees.id))
      .leftJoin(schema.extraFees, eq(schema.payments.extraFeeId, schema.extraFees.id))
      .leftJoin(schema.paymentReceipts, eq(schema.paymentReceipts.paymentId, schema.payments.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(schema.payments.createdAt);

    const structureIds = [...new Set(rows.map((r) => r.studentFee?.feeStructureId).filter((x): x is string => Boolean(x)))];
    const structures = structureIds.length
      ? await db.select().from(schema.feeStructures).where(inArray(schema.feeStructures.id, structureIds))
      : [];
    const structureById = new Map(structures.map((s) => [s.id, s]));

    let filtered = rows;
    if (filters.classId) filtered = filtered.filter((r) => r.student?.classId === filters.classId);
    if (filters.sectionId) filtered = filtered.filter((r) => r.student?.sectionId === filters.sectionId);
    if (filters.feeType) {
      filtered = filtered.filter((r) => {
        const ft = r.studentFee ? structureById.get(r.studentFee.feeStructureId)?.feeType : r.extraFee?.title;
        return ft === filters.feeType;
      });
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.student?.name.toLowerCase().includes(q) ||
          r.student?.studentId.toLowerCase().includes(q) ||
          r.student?.admissionNumber.toLowerCase().includes(q),
      );
    }

    return filtered.map((r) => ({
      id: r.payment.id,
      student: r.student ? { id: r.student.id, name: r.student.name, studentId: r.student.studentId, admissionNumber: r.student.admissionNumber } : null,
      class: r.class ? { id: r.class.id, name: r.class.name } : null,
      section: r.section ? { id: r.section.id, name: r.section.name } : null,
      feeType: r.studentFee ? structureById.get(r.studentFee.feeStructureId)?.feeType ?? null : r.extraFee?.title ?? (r.payment.paymentType === "ADMISSION" ? "Admission Fee" : null),
      amount: r.payment.amount,
      currency: r.payment.currency,
      method: r.payment.method ?? r.payment.gateway,
      gateway: r.payment.gateway,
      status: r.payment.status,
      orderId: r.payment.orderId,
      razorpayPaymentId: r.payment.gateway === "RAZORPAY" ? r.payment.paymentId : null,
      referenceNote: r.payment.referenceNote,
      chequeNumber: r.payment.chequeNumber,
      bankName: r.payment.bankName,
      receivedByName: r.payment.receivedByName,
      paidAt: r.payment.paidAt,
      createdAt: r.payment.createdAt,
      receiptNumber: r.receipt?.receiptNumber ?? null,
    }));
  }

  /** Self-service payment history: STUDENT sees their own, PARENT sees all
   * linked children's payments, combined and sorted by most recent. */
  async listMyPayments(user: AuthenticatedUser) {
    if (user.role === "STUDENT") {
      return db.select().from(schema.payments).where(eq(schema.payments.studentId, user.profileId!)).orderBy(schema.payments.createdAt);
    }
    if (user.role === "PARENT") {
      const childIds = await this.ownershipService.getLinkedStudentIds(user.profileId!);
      if (childIds.length === 0) return [];
      const all = await Promise.all(childIds.map((id) => db.select().from(schema.payments).where(eq(schema.payments.studentId, id))));
      return all.flat().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    // Admins should use GET /payments with explicit filters instead.
    return db.select().from(schema.payments);
  }
}
