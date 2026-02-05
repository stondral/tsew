"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProductAction(data: any) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();

    const { user } = await payload.auth({
      headers: requestHeaders,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin" && (user as any).role !== "sellerEmployee")) {
      return { success: false, error: "Unauthorized" };
    }

    const { hasPermission, getSellersWithPermission } = await import('@/lib/rbac/permissions');
    
    // Determine target seller organization
    let targetSellerId = data.sellerId;
    
    if (!targetSellerId) {
      const allowedSellers = await getSellersWithPermission(payload, user.id, 'product.create');
      
      // Look for a real organization ID among allowed sellers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orgs = await (payload as any).find({
        collection: 'sellers',
        where: { id: { in: allowedSellers } },
        limit: 1,
        overrideAccess: true,
      })
      
      if (orgs.docs.length > 0) {
        targetSellerId = orgs.docs[0].id;
      } else {
        targetSellerId = user.id; // Legacy owner fallback
      }
    }

    const canCreate = await hasPermission(payload, user.id, targetSellerId, 'product.create');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!canCreate && (user as any).role !== "admin") {
      return { success: false, error: "You don't have permission to create products for this organization" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = {
      name: data.name,
      description: data.description,
      basePrice: parseFloat(data.basePrice),
      compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
      stock: parseInt(data.stock),
      sku: data.sku || null,
      category: data.category,
      seller: targetSellerId,
      status: "pending",
      isActive: data.isActive ?? true,
      refundPolicy: data.refundPolicy,
      seo: {
        title: data.seoTitle,
        description: data.seoDescription,
      },
      media: data.media || [],
    };

    if (data.variants && data.variants.length > 0) {
      insertData.variants = data.variants;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await (payload as any).create({
      collection: "products",
      data: insertData,
    });

    revalidatePath("/seller/products");

    return { success: true, product };
  } catch (err: unknown) {
    console.error("Critical error in createProductAction:", err);
    return { success: false, error: (err as Error).message || "Failed to create product" };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProductAction(id: string, data: any) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();

    const { user } = await payload.auth({
      headers: requestHeaders,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin" && (user as any).role !== "sellerEmployee")) {
      return { success: false, error: "Unauthorized" };
    }

    const { hasPermission } = await import('@/lib/rbac/permissions');

    // Fetch product to check current seller
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await (payload as any).findByID({
      collection: "products",
      id,
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const productSellerId = typeof product.seller === 'object' ? product.seller.id : product.seller;
    const canEdit = await hasPermission(payload, user.id, productSellerId, 'product.edit');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!canEdit && (user as any).role !== "admin") {
      return { success: false, error: "You don't have permission to edit this product" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedProduct = await (payload as any).update({
      collection: "products",
      id,
      data: {
        name: data.name,
        description: data.description,
        basePrice: parseFloat(data.basePrice),
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
        stock: parseInt(data.stock),
        sku: data.sku || null,
        category: data.category,
        isActive: data.isActive,
        refundPolicy: data.refundPolicy,
        seo: {
          title: data.seoTitle,
          description: data.seoDescription,
        },
        media: data.media || [],
        variants: data.variants || [],
      },
    });

    revalidatePath("/seller/products");
    
    return { success: true, product: updatedProduct };
  } catch (err: unknown) {
    console.error("Critical error in updateProductAction:", err);
    return { success: false, error: (err as Error).message || "Failed to update product" };
  }
}
