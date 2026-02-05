// app/(frontend)/checkout/page.tsx
import { redirect } from "next/navigation";
import PremiumCheckout from "./PremiumCheckout";
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const payload = await getPayload({ config });

  // Get headers and create a Headers object
  const headersList = await headers();
  const requestHeaders = new Headers();

  // Copy headers from the incoming request
  headersList.forEach((value, key) => {
    requestHeaders.set(key, value);
  });

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth?redirect=/checkout");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addresses = await (payload as any).find({
    collection: "addresses",
    where: {
      user: { equals: user.id },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PremiumCheckout addresses={addresses.docs as any} userId={user.id} />;
}
