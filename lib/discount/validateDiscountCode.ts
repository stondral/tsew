"use server";

import { getPayload } from "payload";
import config from "@/payload.config";

export interface DiscountValidationResult {
  valid: boolean;
  error?: string;
  discount?: {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
    usedCount: number;
    usageLimit?: number;
    discountSource: "store" | "seller";
    sellerId?: string;
  };
}

/**
 * Server-side discount code validation
 * This is called at EVERY payment checkpoint to prevent fraud
 */
export async function validateDiscountCode(
  code: string,
  currentSubtotal: number,
  items?: { productId: string; sellerId: string; subtotal: number }[]
): Promise<DiscountValidationResult> {
  if (!code || !code.trim()) {
    return { valid: false, error: "Please enter a discount code" };
  }

  const payload = await getPayload({ config });

  try {
    const discounts = await payload.find({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: "discount-codes" as any,
      where: {
        code: { equals: code.toUpperCase().trim() },
        isActive: { equals: true },
      },
      limit: 1,
    });

    if (discounts.docs.length === 0) {
      return { valid: false, error: "Invalid discount code" };
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discount = discounts.docs[0] as any;
    const now = new Date();

    // Validate expiration
    if (discount.expiresAt && new Date(discount.expiresAt) < now) {
      return { valid: false, error: "Discount code has expired" };
    }

    // Validate usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { valid: false, error: "Discount code usage limit reached" };
    }

    const source = discount.discountSource || "store";
    const sellerId = source === "seller" ? (typeof discount.seller === 'string' ? discount.seller : discount.seller?.id) : undefined;
    
    let applicableSubtotal = currentSubtotal;
    if (source === "seller" && sellerId) {
      if (items) {
        applicableSubtotal = items
          .filter(item => item.sellerId === sellerId)
          .reduce((sum, item) => sum + item.subtotal, 0);

        if (applicableSubtotal === 0) {
          return { valid: false, error: "This discount code is not applicable to any items in your cart" };
        }
      } else {
        // If items not provided, we can't fully validate seller subtotal yet
        // but we can return the discount info so calculations.ts can do the final check
      }
    }

    // Validate minimum order value
    if (discount.minOrderValue && applicableSubtotal < discount.minOrderValue) {
      const context = source === "seller" ? "from this seller " : "";
      return {
        valid: false,
        error: `Minimum order value of ₹${discount.minOrderValue} ${context}required`,
      };
    }

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minOrderValue: discount.minOrderValue,
        maxDiscount: discount.maxDiscount,
        usedCount: discount.usedCount,
        usageLimit: discount.usageLimit,
        discountSource: source,
        sellerId: sellerId,
      },
    };
  } catch (err) {
    console.error("Discount validation error:", err);
    return { valid: false, error: "Failed to validate discount code" };
  }
}

/**
 * Calculate discount amount based on discount type and subtotal
 * Used for consistent calculation across all payment flows
 */
export async function calculateDiscountAmount(
  discountType: "percentage" | "fixed",
  discountValue: number,
  subtotal: number,
  maxDiscount?: number
): Promise<number> {
  let discountAmount = 0;

  if (discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
    // Apply max discount cap if specified
    if (maxDiscount && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }
  } else if (discountType === "fixed") {
    // Can't exceed subtotal
    discountAmount = Math.min(discountValue, subtotal);
  }

  // Round to 2 decimals
  return Math.round(discountAmount * 100) / 100;
}
