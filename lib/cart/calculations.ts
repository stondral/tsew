

export interface CartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CalculatedItem {
  productId: string;
  variantId?: string | null;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string; // Optional URL for UI
  stock: number;
  sellerId: string;
}

export interface CalculationResult {
  items: CalculatedItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  platformFee: number; // From createCheckout logic
  discountAmount: number;
  discountCode?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountSource?: "store" | "seller";
  discountSellerId?: string;
  total: number;
  isStockProblem: boolean;
  stockErrors: string[]; // Details about which items are out of stock
}

/**
 * reliableCheckoutCalculation
 * Single source of truth for all checkout math.
 * IMPORTANT: Discount code is revalidated server-side at every call
 */
export async function calculateCartTotals(
  items: CartItemInput[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  discountCode?: string
): Promise<CalculationResult> {
  const calculatedItems: CalculatedItem[] = [];
  const stockErrors: string[] = [];
  let subtotal = 0;
  let isStockProblem = false;

  for (const item of items) {
    const product = await payload.findByID({
      collection: "products",
      id: item.productId,
      depth: 2, // Ensure media and variants.image are populated
    });

    if (!product || product.status !== "live" || !product.isActive) {
      stockErrors.push(`Product not available: ${item.productId}`);
      isStockProblem = true;
      continue;
    }

    let price = product.basePrice;
    let stock = product.stock;
    const name = product.name;
    let image = ""; 
    let variant = null;

    // 1. Try to get product-level media
    if (product.media && Array.isArray(product.media) && product.media.length > 0) {
      const firstMedia = product.media[0];
      if (typeof firstMedia === 'object') {
        // Try thumbnail size first, then main URL
        image = firstMedia.sizes?.thumbnail?.url || firstMedia.url || '';
      }
    }

    if (item.variantId) {
      const variants = product.variants || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variant = variants?.find((v: any) => v.id === item.variantId);
      if (!variant) {
        stockErrors.push(`Variant not found for: ${product.name}`);
        isStockProblem = true;
        continue;
      }
      price = variant.price;
      stock = variant.stock;
      
      // 2. If variant has specific image, use it (and try thumbnail size)
      if (variant.image && typeof variant.image === 'object') {
        image = variant.image.sizes?.thumbnail?.url || variant.image.url || image;
      }
    }

    if (stock < item.quantity) {
      const variantInfo = item.variantId && variant ? ` (${variant.name})` : '';
      stockErrors.push(
        `${name}${variantInfo}: Requested ${item.quantity}, Available ${stock}`
      );
      isStockProblem = true;
    }

    const itemSubtotal = price * item.quantity;
    subtotal += itemSubtotal;

    calculatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
        image,
        stock,
        sellerId: typeof product.seller === 'string' ? product.seller : product.seller.id,
    });
  }

  // Business Logic Rules
  // 1. Shipping: Free if subtotal > 499, else 40
  const shipping = subtotal > 499 ? 0 : 40;

  // 2. Tax: 0 (included in product price)
  const tax = 0;

  // 3. Platform Fee: Flat 15 (from createCheckout legacy)
  const platformFee = 15;

  // 4. Discount Code Validation & Application (SERVER-SIDE REVALIDATION)
  let discountAmount = 0;
  let appliedDiscountCode: string | undefined;
  let discountType: "percentage" | "fixed" | undefined;
  let discountValue: number | undefined;
  let discountSource: "store" | "seller" | undefined;
  let discountSellerId: string | undefined;

  if (discountCode && discountCode.trim()) {
    try {
      // Server-side validation at every payment checkpoint
      const discounts = await payload.find({
        collection: "discount-codes",
        where: {
          code: { equals: discountCode.toUpperCase().trim() },
          isActive: { equals: true },
        },
        limit: 1,
      });

      if (discounts.docs.length > 0) {
        const discount = discounts.docs[0];
        const now = new Date();
        
        // Validate expiration
        if (discount.expiresAt && new Date(discount.expiresAt) < now) {
          stockErrors.push("Discount code has expired");
          isStockProblem = true;
        }
        // Validate usage limit
        else if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
          stockErrors.push("Discount code usage limit reached");
          isStockProblem = true;
        }
        else {
          const source = discount.discountSource || "store";
          const sellerId = source === "seller" ? (typeof discount.seller === 'string' ? discount.seller : discount.seller?.id) : undefined;
          
          // For seller discounts, calculate based ONLY on that seller's items
          let applicableSubtotal = subtotal;
          if (source === "seller" && sellerId) {
            applicableSubtotal = calculatedItems
              .filter(item => item.sellerId === sellerId)
              .reduce((sum, item) => sum + item.subtotal, 0);

            if (applicableSubtotal === 0) {
              stockErrors.push("This discount code is not applicable to any items in your cart");
              isStockProblem = true;
            }
          }

          // Validate minimum order value against applicable subtotal
          if (!isStockProblem && discount.minOrderValue && applicableSubtotal < discount.minOrderValue) {
            const context = source === "seller" ? "from this seller " : "";
            stockErrors.push(`Minimum order value of ₹${discount.minOrderValue} ${context}required for this discount`);
            isStockProblem = true;
          }

          // Apply discount if everything is still fine
          if (!isStockProblem) {
            appliedDiscountCode = discount.code;
            discountType = discount.type;
            discountValue = discount.value;
            discountSource = source;
            discountSellerId = sellerId;

            if (discount.type === "percentage") {
              discountAmount = (applicableSubtotal * discount.value) / 100;
              // Apply max discount cap if specified
              if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
                discountAmount = discount.maxDiscount;
              }
            } else if (discount.type === "fixed") {
              discountAmount = Math.min(discount.value, applicableSubtotal); // Can't exceed applicable subtotal
            }
            
            discountAmount = Math.round(discountAmount * 100) / 100; // Round to 2 decimals
          }
        }
      } else {
        stockErrors.push("Invalid discount code");
        isStockProblem = true;
      }
    } catch (err) {
      console.error("Discount validation error:", err);
      stockErrors.push("Failed to validate discount code");
      isStockProblem = true;
    }
  }

  const total = subtotal + shipping + tax + platformFee - discountAmount;

  return {
    items: calculatedItems,
    subtotal,
    shipping,
    tax,
    platformFee,
    discountAmount,
    discountCode: appliedDiscountCode,
    discountType,
    discountValue,
    discountSource,
    discountSellerId,
    total,
    isStockProblem,
    stockErrors,
  };
}
