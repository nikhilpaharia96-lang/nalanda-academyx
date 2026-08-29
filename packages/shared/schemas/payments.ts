import { z } from "zod";

export const createRazorpayOrderSchema = z.object({
  studentFeeId: z.string().optional(),
  extraFeeId: z.string().optional(),
  admissionApplicationId: z.string().optional(),
  amount: z.number().positive(), // in rupees; converted to paise server-side
});
export type CreateRazorpayOrderDto = z.infer<typeof createRazorpayOrderSchema>;

export const verifyRazorpayPaymentSchema = z.object({
  paymentRecordId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifyRazorpayPaymentDto = z.infer<typeof verifyRazorpayPaymentSchema>;

export const recordOfflinePaymentSchema = z.object({
  studentId: z.string().min(1),
  studentFeeId: z.string().optional(),
  extraFeeId: z.string().optional(),
  amount: z.number().positive(),
  gateway: z.enum(["OFFLINE_CASH", "OFFLINE_UPI", "OFFLINE_BANK_TRANSFER", "OFFLINE_OTHER"]),
  referenceNote: z.string().optional(),
  paidAt: z.string().optional(),
});
export type RecordOfflinePaymentDto = z.infer<typeof recordOfflinePaymentSchema>;
