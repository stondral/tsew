import { CartClient } from "./cart.types"

const CART_KEY = "cart"

export function loadCart(): CartClient {
  try {
    const raw = localStorage.getItem(CART_KEY)
    console.log("🛒 Loading cart from localStorage:", raw);
    let cart = raw ? JSON.parse(raw) : { items: [] }
    
    // 🛡️ MIGRATION: Handle legacy schema where 'product' object was stored instead of 'productId'
    if (cart.items && Array.isArray(cart.items)) {
      cart.items = cart.items.map((item: any) => {
        if (!item.productId && item.product && item.product.id) {
          console.log("🛒 Migrating legacy cart item:", item.product.id);
          return {
            productId: item.product.id,
            variantId: item.variantId,
            quantity: item.quantity,
          };
        }
        return item;
      });
    }

    console.log("🛒 Parsed and migrated cart:", cart);
    return cart
  } catch (error) {
    console.error("🛒 Error loading cart:", error);
    return { items: [] }
  }
}

export function saveCart(cart: CartClient) {
  try {
    console.log("🛒 Saving cart to localStorage:", cart);
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error("🛒 Error saving cart:", error);
  }
}
