"use server"

import { getPayload } from "payload"
import config from "@/payload.config"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
// removed unused imports

interface WarehouseData {
  seller?: string;
  label: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export async function createWarehouseAction(data: WarehouseData) {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return { ok: false, error: "Unauthorized" }
    }

    const warehouse = await payload.create({
      collection: "warehouses",
      data: data,
    });

    revalidatePath("/seller/warehouses")
    return { ok: true, data: warehouse }
  } catch (error) {
    console.error("Failed to create warehouse:", error);
    return { ok: false, error: (error as Error).message || "Failed to create warehouse" };
  }
}

export async function updateWarehouseAction(id: string, data: Partial<WarehouseData>) {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return { ok: false, error: "Unauthorized" }
    }

    const warehouse = await payload.update({
      collection: "warehouses",
      id,
      data: data,
    });

    revalidatePath("/seller/warehouses")
    return { ok: true, data: warehouse }
  } catch (error) {
    console.error("Failed to update warehouse:", error);
    return { ok: false, error: (error as Error).message || "Failed to update warehouse" };
  }
}

export async function deleteWarehouseAction(id: string) {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return { ok: false, error: "Unauthorized" }
    }

    await payload.delete({
      collection: "warehouses",
      id,
    });

    revalidatePath("/seller/warehouses")
    return { ok: true }
  } catch (error) {
    console.error("Failed to delete warehouse:", error);
    return { ok: false, error: (error as Error).message || "Failed to delete warehouse" };
  }
}
