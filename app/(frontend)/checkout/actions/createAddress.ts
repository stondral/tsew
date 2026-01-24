// app/(frontend)/checkout/actions/createAddress.ts
"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

export type AddressInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  addressType?: "home" | "work" | "other";
};

export async function createAddress(data: AddressInput) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = await (payload as any).create({
      collection: "addresses",
      data: {
        user: user.id,
        label: `${data.firstName}'s ${data.addressType || "Home"}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        apartment: data.apartment || "",
        city: data.city,
        state: data.state,
        postalCode: data.pincode, // Mapping frontend pincode to backend postalCode
        country: "India",
        addressType: data.addressType || "home",
        isDefault: false,
      },
    });

    return {
      ok: true,
      addressId: address.id,
    };
  } catch (e) {
    console.error("Failed to create address", e);
    return { ok: false, error: "Failed to save address. Please check all fields." };
  }
}
