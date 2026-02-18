// app/api/cart/route.ts
import { getPayload } from "payload";
import config from "@/payload.config";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCart } from "@/lib/redis/cart";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

/**
 * GET /api/cart
 * Fetch the authenticated user's cart from Redis (with DB fallback)
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
    // Use Redis cart layer (automatic DB fallback)
    const items = await getCart(user.id);

    return NextResponse.json({
      items: items || [],
    });
  } catch (e) {
    logger.error({ err: e, userId: user.id }, "Failed to fetch cart");
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

/**
 * POST /api/cart
 * Update cart (uses Redis with background DB sync)
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

    // Use Redis cart layer (instant update with background DB sync)
    const { setCart } = await import("@/lib/redis/cart");
    await setCart(user.id, items);

    return NextResponse.json({
      success: true,
      cart: { items },
    });
  } catch (e) {
    logger.error({ err: e, userId: user.id }, "Failed to update cart");
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
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

    // Use Redis cart layer for merging (instant with background DB sync)
    const { mergeGuestCart } = await import("@/lib/redis/cart");
    const mergedItems = await mergeGuestCart(user.id, guestItems);

    return NextResponse.json({
      success: true,
      cart: { items: mergedItems },
    });
  } catch (e) {
    logger.error({ err: e, userId: user.id }, "Failed to merge cart");
    return NextResponse.json({ error: "Failed to merge cart" }, { status: 500 });
  }
}
