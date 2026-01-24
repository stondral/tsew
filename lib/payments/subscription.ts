// lib/payments/subscription.ts
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function getOrCreateRazorpayCustomer(email: string, name: string, phone?: string) {
  // Search for existing customer
  // No-op - implementation moved to user registration or stored in DB

  // Since we plan to store it in Users collection, the server action will handle the logic 
  // of checking if user already has a razorpayCustomerId.
  
  const customer = await razorpay.customers.create({
    email,
    name,
    contact: phone,
  });

  return customer;
}

export async function createRazorpaySubscription(
  planId: string,
  customerId: string,
  totalCount: number = 12, // e.g., for 1 year
  planName?: string,
  billingCycle?: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = await (razorpay.subscriptions as any).create({
    plan_id: planId,
    customer_id: customerId,
    total_count: totalCount,
    quantity: 1,
    notes: {
        plan: planName,
        billingCycle: billingCycle,
    }
    // Add other options like start_at, expire_by if needed
  });

  return subscription;
}

export function verifySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string
) {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = paymentId + "|" + subscriptionId;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
