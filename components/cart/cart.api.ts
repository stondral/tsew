// components/cart/cart.api.ts
import { CartClient } from "./cart.types";

/**
 * Fetch the authenticated user's cart from the database
 */
export async function fetchCartFromDB(): Promise<CartClient> {
  try {
    const response = await fetch("/api/cart", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated
        return { items: [] };
      }
      throw new Error("Failed to fetch cart");
    }

    const data = await response.json();
    return { items: data.items || [] };
  } catch (error) {
    console.error("Error fetching cart from DB:", error);
    return { items: [] };
  }
}

/**
 * Sync cart to database (upsert operation)
 */
export async function syncCartToDB(cart: CartClient): Promise<boolean> {
  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ items: cart.items }),
    });

    if (!response.ok) {
      throw new Error("Failed to sync cart");
    }

    return true;
  } catch (error) {
    console.error("Error syncing cart to DB:", error);
    return false;
  }
}

/**
 * Merge guest cart with user's cart on login
 */
export async function mergeGuestCart(guestCart: CartClient): Promise<CartClient> {
  try {
    const response = await fetch("/api/cart", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ guestItems: guestCart.items }),
    });

    if (!response.ok) {
      throw new Error("Failed to merge cart");
    }

    const data = await response.json();
    return { items: data.cart.items || [] };
  } catch (error) {
    console.error("Error merging guest cart:", error);
    return { items: [] };
  }
}
