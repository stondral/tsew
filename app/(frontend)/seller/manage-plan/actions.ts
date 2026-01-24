"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { createRazorpaySubscription, verifySubscriptionSignature } from "@/lib/payments/subscription";
import Razorpay from "razorpay";
import { handleSubscriptionPaid } from "@/lib/payments/handleSubscriptionPaid";
import { User } from "@/payload-types";

// Extend the generated User type with missing fields
interface ExtendedUser extends User {
  role?: 'admin' | 'seller' | 'user';
  username?: string;
  phone?: string;
  subscriptionId?: string;
  razorpayCustomerId?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'pending' | 'cancelled';
  nextBillingDate?: string;
  plan?: 'starter' | 'pro' | 'elite';
  billingCycle?: 'monthly' | 'yearly';
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Map internal plan names to Razorpay Plan IDs from ENV
const PLAN_ID_MAP: Record<string, string | undefined> = {
  "starter_monthly": process.env.RAZORPAY_PLAN_STARTER_MONTHLY,
  "starter_yearly": process.env.RAZORPAY_PLAN_STARTER_YEARLY,
  "pro_monthly": process.env.RAZORPAY_PLAN_PRO_MONTHLY,
  "pro_yearly": process.env.RAZORPAY_PLAN_PRO_YEARLY,
  "elite_monthly": process.env.RAZORPAY_PLAN_ELITE_MONTHLY,
  "elite_yearly": process.env.RAZORPAY_PLAN_ELITE_YEARLY,
};

export async function createSubscriptionAction(planName: string, billingCycle: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user: rawUser } = await payload.auth({
    headers: requestHeaders,
  });
  const user = rawUser as ExtendedUser | null;

  if (!user || user.role !== "seller") {
    return { ok: false, error: "Unauthorized" };
  }

  const planKey = `${planName.toLowerCase()}_${billingCycle.toLowerCase()}`;
  const razorpayPlanId = PLAN_ID_MAP[planKey];

  if (!razorpayPlanId) {
    return { ok: false, error: "Invalid plan or Plan ID not configured in ENV" };
  }

  try {
    // 1. Ensure User has a Razorpay Customer ID
    let customerId = user.razorpayCustomerId;
    if (!customerId) {
        const customer = await razorpay.customers.create({
            email: user.email,
            name: user.username || user.email,
            contact: user.phone,
        });
        customerId = customer.id;
        
        await payload.update({
            collection: "users",
            id: user.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { razorpayCustomerId: customerId } as any
        });
    }

    // 2. Create Subscription
    const subscription = await createRazorpaySubscription(
        razorpayPlanId, 
        customerId, 
        billingCycle === 'monthly' ? 12 : 1, // 12 for monthly, 1 for yearly (recurs automatically)
        planName,
        billingCycle
    );

    // 3. Update User with pending subscription
    await payload.update({
        collection: "users",
        id: user.id,
        data: {
            subscriptionId: subscription.id,
            subscriptionStatus: "pending",
            billingCycle: billingCycle as 'monthly' | 'yearly',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
    });

    return {
      ok: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      customerDetails: {
          name: user.username,
          email: user.email,
          contact: user.phone,
      }
    };
  } catch (error: unknown) {
    console.error("Subscription creation failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create subscription" };
  }
}

export async function verifySubscriptionAction(data: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
    planName: 'starter' | 'pro' | 'elite';
}) {
  const payload = await getPayload({ config });
  
  const isValid = verifySubscriptionSignature(
    data.razorpay_subscription_id,
    data.razorpay_payment_id,
    data.razorpay_signature
  );

  if (!isValid) {
    return { ok: false, error: "Invalid signature" };
  }

  try {
    // Fetch subscription details to get next billing date
    const subscription = await razorpay.subscriptions.fetch(data.razorpay_subscription_id);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = subscription as any;
    const nextCharge = sub.next_charge || sub.current_end || sub.charge_at || 0;

    await handleSubscriptionPaid(
        payload,
        data.razorpay_subscription_id,
        data.planName,
        nextCharge,
        sub.notes?.billingCycle
    );

    return { ok: true };
  } catch (error: unknown) {
    console.error("Subscription verification failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

export async function cancelSubscriptionAction() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user: rawUser } = await payload.auth({
    headers: requestHeaders,
  });
  const user = rawUser as ExtendedUser | null;

  if (!user || !user.subscriptionId) {
    return { ok: false, error: "No active subscription found" };
  }

  try {
    // 1. Cancel in Razorpay
    await razorpay.subscriptions.cancel(user.subscriptionId);

    // 2. Update Payload
    await payload.update({
        collection: "users",
        id: user.id,
        data: {
            subscriptionStatus: "cancelled",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
    });

    return { ok: true };
  } catch (error: unknown) {
    console.error("Subscription cancellation failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to cancel subscription" };
  }
}
