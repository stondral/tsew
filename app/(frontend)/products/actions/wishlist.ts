"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { mapPayloadProductToDomain } from "@/lib/products";

export async function toggleWishlist(productId: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) {
    return { ok: false, error: "Please login to save items to your wishlist." };
  }

  // 1. Get user's wishlist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wishlists = await (payload as any).find({
    collection: "wishlist",
    where: {
      user: { equals: user.id },
    },
    limit: 1,
  });

  const wishlist = wishlists.docs[0];

  if (!wishlist) {
    // 2. Create if not exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).create({
      collection: "wishlist",
      data: {
        user: user.id,
        products: [productId],
      },
    });
    revalidatePath('/wishlist');
    return { ok: true, wishlisted: true };
  }

  // 3. Toggle product in array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (wishlist.products as any[] || []).map(p => typeof p === 'object' ? p.id : p);
  const isWishlisted = products.includes(productId);
  
  let newProducts;
  if (isWishlisted) {
    newProducts = products.filter((id: string) => id !== productId);
  } else {
    newProducts = [...products, productId];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (payload as any).update({
    collection: "wishlist",
    id: wishlist.id,
    data: {
      products: newProducts,
    },
  });

  revalidatePath('/wishlist');
  revalidatePath(`/products/${productId}`); // Optional if slug is known, but usually actions are called from many places
  
  return { ok: true, wishlisted: !isWishlisted };
}

export async function getWishlistStatus(productId: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) return { wishlisted: false };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wishlists = await (payload as any).find({
    collection: "wishlist",
    where: {
      user: { equals: user.id },
      products: { contains: productId },
    },
    limit: 1,
  });

  return { wishlisted: wishlists.docs.length > 0 };
}

export async function getWishlist() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) return { ok: false, error: "Authentication required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wishlists = await (payload as any).find({
    collection: "wishlist",
    where: {
      user: { equals: user.id },
    },
    depth: 2,
    limit: 1,
  });

  const wishlist = wishlists.docs[0];
  if (!wishlist) return { ok: true, products: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (wishlist.products || []).map((p: any) => mapPayloadProductToDomain(p));

  return { ok: true, products };
}
