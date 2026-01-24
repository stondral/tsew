"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type AddressInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  addressType?: "home" | "work" | "other";
  isDefault?: boolean;
  label?: string;
};

export async function createAddressAction(data: AddressInput) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // If setting as default, unset other default addresses first
    if (data.isDefault) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).update({
        collection: "addresses",
        where: {
          user: { equals: user.id },
          isDefault: { equals: true },
        },
        data: { isDefault: false },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = await (payload as any).create({
      collection: "addresses",
      data: {
        user: user.id,
        label: data.label || `${data.firstName}'s ${data.addressType || "Home"}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        apartment: data.apartment || "",
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || "India",
        addressType: data.addressType || "home",
        isDefault: data.isDefault || false,
      },
    });

    revalidatePath("/profile/addresses");
    return {
      success: true,
      addressId: address.id,
    };
  } catch (e) {
    console.error("Failed to create address", e);
    return { success: false, error: "Failed to save address. Please check all fields." };
  }
}

export async function updateAddressAction(id: string, data: AddressInput) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify user owns this address
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAddress = await (payload as any).findByID({
      collection: "addresses",
      id,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!existingAddress || (existingAddress.user as any).id !== user.id) {
      return { success: false, error: "Address not found" };
    }

    // If setting as default, unset other default addresses first
    if (data.isDefault) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).update({
        collection: "addresses",
        where: {
          user: { equals: user.id },
          isDefault: { equals: true },
          id: { not_equals: id },
        },
        data: { isDefault: false },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = await (payload as any).update({
      collection: "addresses",
      id,
      data: {
        label: data.label || `${data.firstName}'s ${data.addressType || "Home"}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        apartment: data.apartment || "",
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || "India",
        addressType: data.addressType || "home",
        isDefault: data.isDefault || false,
      },
    });

    revalidatePath("/profile/addresses");
    return {
      success: true,
      addressId: address.id,
    };
  } catch (e) {
    console.error("Failed to update address", e);
    return { success: false, error: "Failed to update address. Please check all fields." };
  }
}

export async function deleteAddressAction(id: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify user owns this address
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAddress = await (payload as any).findByID({
      collection: "addresses",
      id,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!existingAddress || (existingAddress.user as any).id !== user.id) {
      return { success: false, error: "Address not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).delete({
      collection: "addresses",
      id,
    });

    revalidatePath("/profile/addresses");
    return {
      success: true,
    };
  } catch (e) {
    console.error("Failed to delete address", e);
    return { success: false, error: "Failed to delete address" };
  }
}

export async function setDefaultAddressAction(id: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify user owns this address
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAddress = await (payload as any).findByID({
      collection: "addresses",
      id,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!existingAddress || (existingAddress.user as any).id !== user.id) {
      return { success: false, error: "Address not found" };
    }

    // Unset all other default addresses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: "addresses",
      where: {
        user: { equals: user.id },
        isDefault: { equals: true },
      },
      data: { isDefault: false },
    });

    // Set this address as default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: "addresses",
      id,
      data: { isDefault: true },
    });

    revalidatePath("/profile/addresses");
    return {
      success: true,
    };
  } catch (e) {
    console.error("Failed to set default address", e);
    return { success: false, error: "Failed to set default address" };
  }
}
