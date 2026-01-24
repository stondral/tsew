"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { calculateCartTotals, CartItemInput } from "@/lib/cart/calculations";

export async function calculateCheckoutTotals(items: CartItemInput[]) {
  const payload = await getPayload({ config });

  try {
    const result = await calculateCartTotals(items, payload);
    return { ok: true, data: result };
  } catch (error) {
    console.error("Error calculating totals:", error);
    return { ok: false, error: "Failed to calculate totals" };
  }
}
