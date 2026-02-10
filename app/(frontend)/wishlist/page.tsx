import { getWishlist } from "@/app/(frontend)/products/actions/wishlist";
import WishlistPageClient from "@/components/wishlist/WishlistPageClient";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) {
    redirect("/auth");
  }

  const res = await getWishlist();
  
  if (!res.ok) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 font-bold">{res.error}</p>
      </div>
    );
  }

  return <WishlistPageClient initialProducts={res.products || []} />;
}
