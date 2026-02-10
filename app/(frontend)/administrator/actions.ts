"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function verifyAdmin() {
  const h = await headers();
  const payload = await getPayload({ config });
  const { user } = await payload.auth({
    headers: h,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || (user as any).role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return { payload, user };
}

export async function approveProductAction(productId: string, isFeatured?: boolean, featuredUntil?: string) {
  try {
    const { payload, user } = await verifyAdmin();

    const updatedProduct = await payload.update({
      collection: "products",
      id: productId,
      data: {
        status: "live",
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
        featured: !!isFeatured,
        featuredUntil: isFeatured ? featuredUntil : null,
      },
    });

    // Notify Seller
    try {
      const product = typeof updatedProduct === 'object' ? updatedProduct : await payload.findByID({ collection: 'products', id: productId });
      const sellerId = typeof product.seller === 'object' ? product.seller.id : product.seller;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sellerOrg = await (payload as any).findByID({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: 'sellers' as any,
        id: sellerId,
      });

      if (sellerOrg && sellerOrg.owner) {
        const owner = typeof sellerOrg.owner === 'object' ? sellerOrg.owner : await payload.findByID({ collection: 'users', id: sellerOrg.owner });
        if (owner) {
          const { getEmailTemplate } = await import("@/lib/email-templates");
          const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
          
          let featuredSection = "";
          if (isFeatured) {
            featuredSection = `
              <div style="background: #fff7ed; border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: center; border: 2px dashed #f97316;">
                <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 18px; font-weight: 800;">✨ Featured Status Activated!</h4>
                <p style="margin: 0; color: #7c2d12; font-size: 14px; line-height: 1.5;">
                  Your product is now being prioritized on our homepage until <strong>${new Date(featuredUntil || '').toLocaleDateString()}</strong>.
                </p>
              </div>
            `;
          }

          const emailHtml = getEmailTemplate('product-approved', {
            username: owner.username || owner.email,
            productName: product.name,
            productUrl: `${frontendURL}/products/${product.slug}`,
            dashboardUrl: `${frontendURL}/seller/products`,
            featuredSection
          });

          await payload.sendEmail({
            to: owner.email,
            subject: `🎉 Your product is live: ${product.name}`,
            html: emailHtml,
          });
        }
      }
    } catch (emailErr) {
      console.error("Failed to notify seller of approval:", emailErr);
    }

    revalidatePath("/administrator/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return { success: false, error: error.message };
  }
}

export async function rejectProductAction(productId: string, reason: string) {
  try {
    const { payload, user } = await verifyAdmin();

    const updatedProduct = await payload.update({
      collection: "products",
      id: productId,
      data: {
        status: "rejected",
        rejectedReason: reason,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      },
    });

    // Notify Seller
    try {
      const product = typeof updatedProduct === 'object' ? updatedProduct : await payload.findByID({ collection: 'products', id: productId });
      const sellerId = typeof product.seller === 'object' ? product.seller.id : product.seller;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sellerOrg = await (payload as any).findByID({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: 'sellers' as any,
        id: sellerId,
      });

      if (sellerOrg && sellerOrg.owner) {
        const owner = typeof sellerOrg.owner === 'object' ? sellerOrg.owner : await payload.findByID({ collection: 'users', id: sellerOrg.owner });
        if (owner) {
          const { getEmailTemplate } = await import("@/lib/email-templates");
          const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
          
          const emailHtml = getEmailTemplate('product-rejected', {
            username: owner.username || owner.email,
            productName: product.name,
            reason: reason,
            editUrl: `${frontendURL}/seller/products/edit/${productId}`
          });

          await payload.sendEmail({
            to: owner.email,
            subject: `Update regarding your product: ${product.name}`,
            html: emailHtml,
          });
        }
      }
    } catch (emailErr) {
      console.error("Failed to notify seller of rejection:", emailErr);
    }

    revalidatePath("/administrator/products");
    return { success: true };
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return { success: false, error: error.message };
  }
}

export async function updateFeaturedStatusAction(productId: string, isFeatured: boolean, featuredUntil?: string) {
  try {
    const { payload } = await verifyAdmin();

    await payload.update({
      collection: "products",
      id: productId,
      data: {
        featured: isFeatured,
        featuredUntil: isFeatured ? featuredUntil : null,
      },
    });

    revalidatePath("/administrator/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return { success: false, error: error.message };
  }
}
