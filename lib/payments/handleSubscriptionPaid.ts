// lib/payments/handleSubscriptionPaid.ts
import { BasePayload } from "payload";

export async function handleSubscriptionPaid(
  payload: BasePayload,
  subscriptionId: string,
  planValue: 'starter' | 'pro' | 'elite',
  nextBillingTimestamp: number,
  billingCycle?: 'monthly' | 'yearly'
) {
  // Find user by subscriptionId
  const { docs: users } = await payload.find({
    collection: "users",
    where: {
      subscriptionId: {
        equals: subscriptionId,
      },
    },
  });

  const user = users[0];

  if (!user) {
    console.error(`User not found for subscriptionId: ${subscriptionId}`);
    return;
  }

  // Convert UNIX timestamp to Date
  let nextBillingDate: Date;
  
  if (nextBillingTimestamp && nextBillingTimestamp > 0) {
    nextBillingDate = new Date(nextBillingTimestamp * 1000);
  } else {
    // Fallback if timestamp is missing: current date + 1 period
    nextBillingDate = new Date();
    if (billingCycle === 'yearly') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
  }

  console.log(`Setting next billing date to: ${nextBillingDate.toISOString()} (from timestamp: ${nextBillingTimestamp})`);

  // Ensure we overwrite any incorrect date in the DB
  const updateData = {
    plan: planValue,
    subscriptionStatus: "active" as const,
    nextBillingDate: nextBillingDate.toISOString(),
    billingCycle: billingCycle,
  };

  await payload.update({
    collection: "users",
    id: user.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: updateData as any, // Cast to any only for Payload's internal type check if needed
  });

  console.log(`Updated user ${user.id} to plan ${planValue} (Subscription: ${subscriptionId})`);
}
