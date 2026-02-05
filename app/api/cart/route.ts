// app/api/cart/route.ts
import { getPayload } from "payload";
import config from "@/payload.config";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

/**
 * GET /api/cart
 * Fetch the authenticated user's cart from the database
 */
export async function GET() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: "carts",
      where: {
        user: { equals: user.id },
      },
      limit: 1,
    });

    if (result.docs.length === 0) {
      // No cart exists yet, return empty cart
      return NextResponse.json({ items: [] });
    }

    const cart = result.docs[0];
    return NextResponse.json({
      items: cart.items || [],
    });
  } catch (e) {
    console.error("Failed to fetch cart", e);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

/**
 * POST /api/cart
 * Sync cart to database (upsert operation)
 */
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
    }

    // Check if user already has a cart
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingCart = await (payload as any).find({
      collection: "carts",
      where: {
        user: { equals: user.id },
      },
      limit: 1,
    });

    if (existingCart.docs.length > 0) {
      // Update existing cart
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (payload as any).update({
        collection: "carts",
        id: existingCart.docs[0].id,
        data: {
          items,
        },
      });

      return NextResponse.json({
        success: true,
        cart: { items: updated.items || [] },
      });
    } else {
      // Create new cart
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await (payload as any).create({
        collection: "carts",
        data: {
          user: user.id,
          items,
        },
      });

      return NextResponse.json({
        success: true,
        cart: { items: created.items || [] },
      });
    }
  } catch (e) {
    console.error("Failed to sync cart", e);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}

/**
 * PUT /api/cart
 * Merge guest cart with user's existing cart (called on login)
 */
export async function PUT(req: NextRequest) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { guestItems } = body;

    if (!Array.isArray(guestItems)) {
      return NextResponse.json({ error: "Invalid guest cart items" }, { status: 400 });
    }

    // Fetch existing user cart
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingCart = await (payload as any).find({
      collection: "carts",
      where: {
        user: { equals: user.id },
      },
      limit: 1,
    });

    // Merge logic: combine items, sum quantities for duplicates
    const existingItems = existingCart.docs.length > 0 ? existingCart.docs[0].items || [] : [];
    
    // Create a map for efficient merging
    const itemMap = new Map();
    
    // Add existing items to map
    existingItems.forEach((item: { productId: string; variantId?: string | null; quantity: number }) => {
      const key = `${item.productId}-${item.variantId || 'null'}`;
      itemMap.set(key, item);
    });
    
    // Merge guest items
    guestItems.forEach((item: { productId: string; variantId?: string | null; quantity: number }) => {
      const key = `${item.productId}-${item.variantId || 'null'}`;
      if (itemMap.has(key)) {
        // Sum quantities
        const existing = itemMap.get(key);
        itemMap.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        // Add new item
        itemMap.set(key, item);
      }
    });

    const mergedItems = Array.from(itemMap.values());

    if (existingCart.docs.length > 0) {
      // Update existing cart
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (payload as any).update({
        collection: "carts",
        id: existingCart.docs[0].id,
        data: {
          items: mergedItems,
        },
      });

      return NextResponse.json({
        success: true,
        cart: { items: updated.items || [] },
      });
    } else {
      // Create new cart with merged items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await (payload as any).create({
        collection: "carts",
        data: {
          user: user.id,
          items: mergedItems,
        },
      });

      return NextResponse.json({
        success: true,
        cart: { items: created.items || [] },
      });
    }
  } catch (e) {
    console.error("Failed to merge cart", e);
    return NextResponse.json({ error: "Failed to merge cart" }, { status: 500 });
  }
}
