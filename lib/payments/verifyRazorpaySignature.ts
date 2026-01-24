// lib/payments/verifyRazorpaySignature.ts
import crypto from "crypto";

export function verifyRazorpaySignature(
  body: string,
  signature: string,
) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expected === signature;
}
