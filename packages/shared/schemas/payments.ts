import { z } from "zod";
import { PAYMENT_GATEWAYS } from "../enums";

export const createRazorpayOrderSchema = z.object({
  studentFeeId: z.string().optional(),
  extraFeeId: z.string().optional(),
  admissionApplicationId: z.string().optional(),
  amount: z.number().positive(), // in rupees; converted to paise server-side.
  // The amount is only ever a *request* for how much the student wants to pay
  // right now (supports partial payment). The server independently loads the
  // fee's remaining balance and rejects any amount that exceeds it — see
  // PaymentsService#resolveContext / #createRazorpayOrder.
});
export type CreateRazorpayOrderDto = z.infer<typeof createRazorpayOrderSchema>;

export const verifyRazorpayPaymentSchema = z.object({
  paymentRecordId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifyRazorpayPaymentDto = z.infer<typeof verifyRazorpayPaymentSchema>;

export const recordOfflinePaymentSchema = z
  .object({
    studentId: z.string().min(1),
    studentFeeId: z.string().optional(),
    extraFeeId: z.string().optional(),
    amount: z.number().positive(),
    gateway: z.enum(PAYMENT_GATEWAYS).refine((g) => g !== "RAZORPAY", { message: "Use the Razorpay flow for online payments" }),
    referenceNote: z.string().optional(),
    // Cheque-specific fields — required by the controller when gateway === OFFLINE_CHEQUE.
    chequeNumber: z.string().optional(),
    bankName: z.string().optional(),
    // Free-text name of the staff member who physically received the money,
    // for front-desk collections recorded by an admin on someone else's behalf.
    // Falls back to the logged-in admin's own name/email when omitted.
    receivedByName: z.string().optional(),
    paidAt: z.string().optional(),
  })
  .refine((dto) => dto.studentFeeId || dto.extraFeeId, {
    message: "An offline payment must be linked to a student fee or an extra fee",
    path: ["studentFeeId"],
  });
export type RecordOfflinePaymentDto = z.infer<typeof recordOfflinePaymentSchema>;

export const waiveFeeSchema = z.object({
  reason: z.string().min(3),
});
export type WaiveFeeDto = z.infer<typeof waiveFeeSchema>;
