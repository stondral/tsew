// app/(frontend)/profile/addresses/page.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AddressClient from "./AddressClient";

export default async function AddressesPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addressesRes = await (payload as any).find({
    collection: "addresses",
    where: {
      user: { equals: user.id },
    },
  });

  const addresses = addressesRes.docs;

  return <AddressClient initialAddresses={addresses} />;
}
