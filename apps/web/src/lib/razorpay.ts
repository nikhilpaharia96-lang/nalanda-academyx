import { api, ApiError } from "./api-client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay checkout can only run in the browser"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the Razorpay checkout script"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

interface PayFeeArgs {
  studentFeeId?: string;
  extraFeeId?: string;
  amount: number;
  studentName: string;
  studentEmail?: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

/** Full client-side half of the payment flow: create a real order via our
 * API (server decides the amount from the fee record — never trusts what's
 * passed here beyond a match check), open Razorpay checkout, then hand the
 * result to our server for signature verification. The payment is only ever
 * marked PAID by the server-side verify call, never by this callback. */
export async function payFee(args: PayFeeArgs) {
  try {
    const order = await api.post<{ paymentRecordId: string; orderId: string; amount: number; currency: string; keyId: string }>(
      "/payments/razorpay/order",
      { studentFeeId: args.studentFeeId, extraFeeId: args.extraFeeId, amount: args.amount },
    );

    await loadRazorpayScript();

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: Math.round(order.amount * 100),
      currency: order.currency,
      name: "Nalanda Academy",
      description: "Fee payment",
      order_id: order.orderId,
      prefill: { name: args.studentName, email: args.studentEmail },
      theme: { color: "#0B1F3A" },
      handler: async (response: any) => {
        try {
          await api.post("/payments/razorpay/verify", {
            paymentRecordId: order.paymentRecordId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          args.onSuccess();
        } catch (err) {
          args.onError(err instanceof ApiError ? err.message : "Payment verification failed");
        }
      },
      modal: {
        ondismiss: () => args.onError("Payment was cancelled"),
      },
    });

    rzp.on("payment.failed", (response: any) => {
      args.onError(response.error?.description || "Payment failed");
    });

    rzp.open();
  } catch (err) {
    args.onError(err instanceof ApiError ? err.message : "Could not start the payment. Please try again.");
  }
}
