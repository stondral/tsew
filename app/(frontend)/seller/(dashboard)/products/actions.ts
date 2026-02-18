"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { User } from "@/payload-types";

interface ExtendedUser extends User {
  role?: 'admin' | 'seller' | 'sellerEmployee' | 'user';
  subscriptionStatus?: 'active' | 'inactive' | 'pending' | 'cancelled';
  username?: string;
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

    if (!user || (user.role !== "seller" && user.role !== "admin" && user.role !== "sellerEmployee")) {
      throw new Error("Unauthorized");
    }

    const { hasPermission } = await import('@/lib/rbac/permissions');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await (payload as any).findByID({
      collection: "products",
      id,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Check granular permission
    const productSellerId = typeof product.seller === 'object' ? product.seller.id : product.seller;
    const canEdit = await hasPermission(payload, user.id, productSellerId, 'product.edit');

    if (!canEdit && user.role !== "admin") {
      throw new Error("You don't have permission to edit this product");
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

    if (!user || (user.role !== "seller" && user.role !== "admin" && user.role !== "sellerEmployee")) {
      throw new Error("Unauthorized");
    }

    const { hasPermission } = await import('@/lib/rbac/permissions');

    // Determine target seller organization
    let targetSellerId = data.sellerId;

    if (!targetSellerId) {
      const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
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

    if (!canCreate && user.role !== "admin") {
      throw new Error("You don't have permission to create products for this organization");
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

    console.log("Payload data object keys:", Object.keys(insertData));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await (payload as any).create({
      collection: "products",
      data: insertData,
    });

    // Notify Admins
    try {
      const admins = await payload.find({
        collection: 'users',
        where: { role: { equals: 'admin' } },
      });

      const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
      const { getEmailTemplate } = await import("@/lib/email-templates");

      for (const admin of admins.docs) {
        const emailHtml = getEmailTemplate('product-submission-admin', {
          productName: product.name,
          sellerName: user.username || user.email,
          approvalUrl: `${frontendURL}/administrator/products`,
        });

        await payload.sendEmail({
          to: admin.email,
          subject: `🚀 New Product Submission: ${product.name}`,
          html: emailHtml,
        });
      }
    } catch (emailErr) {
      console.error("Failed to notify admins of product submission:", emailErr);
    }

    // Send confirmation email to seller
    try {
      const frontendURL2 = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
      const { getEmailTemplate: getSellerEmailTemplate } = await import("@/lib/email-templates");

      const sellerEmailHtml = getSellerEmailTemplate('product-under-review', {
        username: user.username || user.email,
        productName: product.name,
        dashboardUrl: `${frontendURL2}/seller/products`,
      });

      await payload.sendEmail({
        to: user.email,
        subject: `Your Product is Under Review – Stond Emporium`,
        html: sellerEmailHtml,
      });
    } catch (sellerEmailErr) {
      console.error("Failed to send seller confirmation email:", sellerEmailErr);
    }

    revalidatePath("/seller/products");

    return { success: true, product };
  } catch (err) {
    console.error("Error in createProduct:", err);
    const message = err instanceof Error ? err.message : "Failed to create product";
    return { success: false, error: message };
  }
}
