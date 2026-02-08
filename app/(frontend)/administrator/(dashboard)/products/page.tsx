import { getPayload } from "payload";
import config from "@/payload.config";
import { ProductsApprovalClient } from "./ProductsApprovalClient";

export const dynamic = 'force-dynamic';

export default async function ProductsApprovalPage() {
  const payload = await getPayload({ config });

  const { docs: pendingProducts } = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'pending' },
    },
    depth: 2,
  });

  const { docs: liveProducts } = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'live' },
    },
    limit: 10,
    depth: 1,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter">Product Stewardship</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Verify and Feature Market Assets</p>
      </div>

      <ProductsApprovalClient 
        pendingProducts={JSON.parse(JSON.stringify(pendingProducts))} 
        liveProducts={JSON.parse(JSON.stringify(liveProducts))}
      />
    </div>
  );
}
