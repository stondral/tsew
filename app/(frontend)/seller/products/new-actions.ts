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
    if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
      return { success: false, error: "Unauthorized" };
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
      seller: user.id,
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
    if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
      return { success: false, error: "Unauthorized" };
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
