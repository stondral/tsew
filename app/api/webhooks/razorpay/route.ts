// app/api/webhooks/razorpay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/payments/verifyRazorpaySignature";
import { handleRazorpayPayment } from "@/lib/payments/handleRazorpayPayment";
import { getPayload } from "payload";
import config from "@/payload.config";
import { handleSubscriptionPaid } from "@/lib/payments/handleSubscriptionPaid";
import { logger } from "@/lib/logger";

interface RazorpaySubscriptionEvent {
  event: string;
  payload: {
    subscription: {
      entity: {
        id: string;
        notes?: {
          plan?: string;
          billingCycle?: 'monthly' | 'yearly';
        };
        next_charge?: number;
        current_end?: number;
        charge_at?: number;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  if (!verifyRazorpaySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const payload = await getPayload({ config });

  try {
    // 1. Order Payments
    if (event.event === "payment.captured") {
      await handleRazorpayPayment(event);
    }

    // 2. Subscription Payments
    if (event.event === "subscription.paid") {
      const subscriptionEvent = event as RazorpaySubscriptionEvent;
      const subscription = subscriptionEvent.payload.subscription.entity;

      const planValue = subscription.notes?.plan || 'pro';
      const billingCycle = subscription.notes?.billingCycle;
      const nextCharge = subscription.next_charge || subscription.current_end || subscription.charge_at || 0;

      await handleSubscriptionPaid(
        payload,
        subscription.id,
        planValue as 'starter' | 'pro' | 'elite',
        nextCharge,
        billingCycle
      );
    }

    if (event.event === "subscription.cancelled" ||
      event.event === "subscription.halted" ||
      event.event === "subscription.expired") {
      const subscription = (event as RazorpaySubscriptionEvent).payload.subscription.entity;

      const { docs: users } = await payload.find({
        collection: "users",
        where: { subscriptionId: { equals: subscription.id } }
      });

      if (users[0]) {
        await payload.update({
          collection: "users",
          id: users[0].id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { subscriptionStatus: "cancelled" } as any
        });
        logger.info({ userId: users[0].id, event: event.event }, "Updated user subscription status to cancelled");
      }
    }

  } catch (err) {
    logger.error({ err, event: event.event }, "Webhook processing error");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
