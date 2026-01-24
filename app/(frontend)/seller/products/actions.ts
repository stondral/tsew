"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { User } from "@/payload-types";

interface ExtendedUser extends User {
  role?: 'admin' | 'seller' | 'user';
  subscriptionStatus?: 'active' | 'inactive' | 'pending' | 'cancelled';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProduct(id: string, data: any) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();

    const { user: rawUser } = await payload.auth({
      headers: requestHeaders,
    });
    const user = rawUser as ExtendedUser | null;

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await (payload as any).findByID({
      collection: "products",
      id,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (user.role !== "admin" && (product.seller as any).id !== user.id && product.seller !== user.id) {
      throw new Error("Unauthorized");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedProduct = await (payload as any).update({
      collection: "products",
      id,
      data: {
        name: data.name,
        slug: data.slug,
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
    revalidatePath(`/products/${updatedProduct.slug}`);
    revalidatePath(`/seller/products/edit/${id}`);

    return { success: true, product: updatedProduct };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    console.error("Error in updateProduct:", error);
    const message = error instanceof Error ? error.message : "Failed to update product";
    return { success: false, error: message };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProduct(data: any) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();

    const { user: rawUser } = await payload.auth({
      headers: requestHeaders,
    });
    const user = rawUser as ExtendedUser | null;

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    // Subscription Check
    if (user.role !== "admin" && user.subscriptionStatus !== "active") {
        throw new Error("Active subscription required to list products");
    }

    console.log("Creating product with name:", data.name);
    console.log("Category ID:", data.category);
    console.log("Variant data count:", (data.variants || []).length);

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

    console.log("Payload data object keys:", Object.keys(insertData));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await (payload as any).create({
      collection: "products",
      data: insertData,
    });

    revalidatePath("/seller/products");
 
    return { success: true, product };
  } catch (err) {
    console.error("Error in createProduct:", err);
    const message = err instanceof Error ? err.message : "Failed to create product";
    return { success: false, error: message };
  }
}
