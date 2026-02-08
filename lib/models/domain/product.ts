/* ─────────────────────────────
   PRODUCT DOMAIN TYPES
───────────────────────────── */

export interface Product {
  id: string;
  name: string;
    slug: string;
    description: string;
    

  /* ─── Pricing (display only, server re-validates) ─── */
  basePrice: number;
  price?: number;
  compareAtPrice?: number;

  /* ─── Visibility & lifecycle ─── */
  isActive: boolean;
  status: "draft" | "pending" | "live" | "rejected";

  /* ─── Featured (admin-controlled) ─── */
  featured?: boolean;
  featuredUntil?: string | null;

  /* ─── Inventory (non-authoritative on client) ─── */
  sku?: string;
  stock?: number;

  /* ─── Policy (order-relevant) ─── */
  refundPolicy:
    | "14-Days"
    | "7-Days"
    | "5-Days"
    | "Contact Customer Care";

  /* ─── Classification ─── */
  category: {
    name: string;
  };

  /* ─── Media ─── */
  images: string[];

  /* ─── Variants (OPTIONAL by design) ─── */
  variants?: ProductVariant[];

  /* ─── Signals / ranking ─── */
  popularity?: number;

  /* ─── Seller (read-only exposure) ─── */
  seller?: {
    id: string;
    name: string;
    username?: string;
    email?: string;
    isVerified?: boolean;
  };
}

/* ─────────────────────────────
   PRODUCT VARIANT
───────────────────────────── */

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;

  price: number;
  stock: number;

  image?: string;

  attributes: {
    name: string;
    value: string;
  }[];
}
