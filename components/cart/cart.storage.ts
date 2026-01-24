import { CartClient } from "./cart.types"

const CART_KEY = "cart"

export function loadCart(): CartClient {
  try {
    const raw = localStorage.getItem(CART_KEY)
    console.log("🛒 Loading cart from localStorage:", raw);
    const cart = raw ? JSON.parse(raw) : { items: [] }
    console.log("🛒 Parsed cart:", cart);
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
