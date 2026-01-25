

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
  total: number;
  isStockProblem: boolean;
  stockErrors: string[]; // Details about which items are out of stock
}

/**
 * reliableCheckoutCalculation
 * Single source of truth for all checkout math.
 */
export async function calculateCartTotals(
  items: CartItemInput[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
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

  const total = subtotal + shipping + tax + platformFee;

  return {
    items: calculatedItems,
    subtotal,
    shipping,
    tax,
    platformFee,
    total,
    isStockProblem,
    stockErrors,
  };
}
