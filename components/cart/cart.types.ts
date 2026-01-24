/* ─────────────────────────────
   CART DOMAIN (CLIENT)
───────────────────────────── */

export interface CartItemClient {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CartClient {
  items: CartItemClient[];
}

export interface CartContextType {
  cart: CartClient;

  addToCart: (
    productId: string,
    variantId?: string | null,
    quantity?: number
  ) => void;

  removeFromCart: (
    productId: string,
    variantId?: string | null
  ) => void;

  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => void;

  clearCart: () => void;

  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  isLoading: boolean;
}
