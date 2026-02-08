"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({
    headers: new Headers(), // In actual server actions, headers are handled by context
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || (user as any).role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return { payload, user };
}

export async function approveProductAction(productId: string) {
  try {
    const { payload, user } = await verifyAdmin();

    await payload.update({
      collection: "products",
      id: productId,
      data: {
        status: "live",
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      },
    });

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

    await payload.update({
      collection: "products",
      id: productId,
      data: {
        status: "rejected",
        rejectedReason: reason,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      },
    });

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
