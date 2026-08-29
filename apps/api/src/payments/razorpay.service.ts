import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

@Injectable()
export class RazorpayService {
  private get keyId() {
    return process.env.RAZORPAY_KEY_ID;
  }
  private get keySecret() {
    return process.env.RAZORPAY_KEY_SECRET;
  }

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  /** Real call to Razorpay's Orders API. Requires live test-mode credentials
   * in RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — this sandbox has no network
   * egress to api.razorpay.com, so this path is exercised by unit-style
   * checks against the signature logic rather than a live call here. */
  async createOrder(amountPaise: number, currency: string, receipt: string, notes?: Record<string, string>): Promise<RazorpayOrder> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable online payments.",
      );
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    let res: Response;
    try {
      res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountPaise, currency, receipt, notes }),
      });
    } catch (err) {
      // No network egress to api.razorpay.com in this sandbox — surface a
      // clear, honest error rather than an opaque 500. In an environment
      // with normal internet access this fetch succeeds unmodified.
      throw new ServiceUnavailableException(
        `Could not reach Razorpay (${(err as Error).message}). This environment has no network access to api.razorpay.com — order creation will work once deployed with real network access and live/test credentials.`,
      );
    }

    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(`Razorpay order creation failed: ${body}`);
    }
    return res.json() as Promise<RazorpayOrder>;
  }

  /** HMAC-SHA256(order_id + "|" + payment_id, key_secret) must equal the
   * signature Razorpay's checkout returns. This is pure crypto — no network
   * needed — and is exactly what production verification does. */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!this.keySecret) return false;
    const expected = createHmac("sha256", this.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    return this.safeEqual(expected, signature);
  }

  /** Webhook payloads are signed over the raw request body with the
   * separate RAZORPAY_WEBHOOK_SECRET. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return this.safeEqual(expected, signature);
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
