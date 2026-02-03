import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import WarehousesClient from "./WarehousesClient";

export const dynamic = 'force-dynamic';

export default async function WarehousesPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  interface User { id: string; role?: string }
  if (!user || ((user as User).role !== "seller" && (user as User).role !== "admin")) {
    redirect("/login?redirect=/seller/warehouses");
  }

  // Fetch seller's warehouses
  const warehousesRes = await payload.find({
    collection: "warehouses" as never,
    where: {
      user: { equals: user.id },
    },
    limit: 100,
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Warehouses</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
            Manage your pickup locations for order fulfillment
          </p>
        </div>
      </div>

      <WarehousesClient initialWarehouses={warehousesRes.docs} />
    </div>
  );
}
