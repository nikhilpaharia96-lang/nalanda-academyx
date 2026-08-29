import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { RazorpayService } from "./razorpay.service";
import { ReceiptsService } from "./receipts.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import type { CreateRazorpayOrderDto, RecordOfflinePaymentDto } from "@nalanda/shared";

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
      return { studentId: fee.studentId, paymentType: "MONTHLY_FEE" as const, expectedAmount: fee.amount };
    }
    if (dto.extraFeeId) {
      const [fee] = await db.select().from(schema.extraFees).where(eq(schema.extraFees.id, dto.extraFeeId));
      if (!fee) throw new NotFoundException("Extra fee not found");
      return { studentId: fee.studentId ?? undefined, paymentType: "EXTRA_FEE" as const, expectedAmount: fee.amount };
    }
    if (dto.admissionApplicationId) {
      const [app] = await db.select().from(schema.admissionApplications).where(eq(schema.admissionApplications.id, dto.admissionApplicationId));
      if (!app) throw new NotFoundException("Admission application not found");
      return { studentId: undefined, paymentType: "ADMISSION" as const, expectedAmount: undefined };
    }
    return { studentId: undefined, paymentType: "OTHER" as const, expectedAmount: undefined };
  }

  async createRazorpayOrder(dto: CreateRazorpayOrderDto, user: AuthenticatedUser) {
    const ctx = await this.resolveContext(dto);
    if (ctx.studentId) await this.ownershipService.assertCanAccessStudent(ctx.studentId, user);
    if (ctx.expectedAmount !== undefined && Math.round(ctx.expectedAmount) !== Math.round(dto.amount)) {
      // Never trust a client-supplied amount over what the fee record says.
      throw new BadRequestException("Payment amount does not match the fee record");
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
      throw new BadRequestException("Payment signature verification failed");
    }

    return this.finalizePayment(payment.id, {
      paymentId: dto.razorpay_payment_id,
      transactionId: dto.razorpay_payment_id,
      method: "razorpay",
    });
  }

  /** Idempotent webhook handler for the `payment.captured` event. */
  async handleWebhook(rawBody: string, signature: string) {
    const valid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!valid) throw new BadRequestException("Invalid webhook signature");

    const event = JSON.parse(rawBody);
    if (event.event !== "payment.captured") return { ignored: true };

    const razorpayOrderId = event.payload?.payment?.entity?.order_id;
    const razorpayPaymentId = event.payload?.payment?.entity?.id;
    if (!razorpayOrderId || !razorpayPaymentId) return { ignored: true };

    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, razorpayOrderId));
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

    await this.markFeePaid(payment);
    const receipt = await this.receiptsService.generateForPayment(payment.id);
    await this.notifyPaymentSuccess(payment);

    await this.auditService.log({ action: "PAYMENT_VERIFIED", entity: "Payment", entityId: payment.id, description: `Amount ${payment.amount}` });

    return { payment, receipt };
  }

  private async markFeePaid(payment: typeof schema.payments.$inferSelect) {
    if (payment.studentFeeId) {
      await db.update(schema.studentFees).set({ status: "PAID", updatedAt: new Date().toISOString() }).where(eq(schema.studentFees.id, payment.studentFeeId));
    }
    if (payment.extraFeeId) {
      await db.update(schema.extraFees).set({ status: "PAID", updatedAt: new Date().toISOString() }).where(eq(schema.extraFees.id, payment.extraFeeId));
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

  async recordOfflinePayment(dto: RecordOfflinePaymentDto, actorId: string) {
    const ctx = await this.resolveContext(dto);
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
        referenceNote: dto.referenceNote,
        paidAt: dto.paidAt || new Date().toISOString(),
      })
      .returning();

    await this.markFeePaid(payment);
    const receipt = await this.receiptsService.generateForPayment(payment.id);
    await this.notifyPaymentSuccess(payment);
    await this.auditService.log({ userId: actorId, action: "PAYMENT_OFFLINE_RECORD", entity: "Payment", entityId: payment.id });

    return { payment, receipt };
  }

  async getReceipt(paymentId: string, user: AuthenticatedUser) {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, paymentId));
    if (!payment) throw new NotFoundException("Payment not found");
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

  /** Self-service payment history: STUDENT sees their own, PARENT sees all
   * linked children's payments, combined and sorted by most recent. */
  async listMyPayments(user: AuthenticatedUser) {
    if (user.role === "STUDENT") {
      return db.select().from(schema.payments).where(eq(schema.payments.studentId, user.profileId!));
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
