import { getPayload } from "payload"
import config from "@/payload.config"
import { headers } from "next/headers"
import { getIncomingOrders } from "@/lib/orders"
import IncomingOrdersClient from "./IncomingOrdersClient"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic';

export default async function IncomingOrdersPage() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  interface User { id: string; role?: string }
  if (!user || ((user as User).role !== 'seller' && (user as User).role !== 'admin' && (user as User).role !== 'sellerEmployee')) {
    redirect("/auth?redirect=/seller/orders/incoming")
  }

  // Get sellers where user has order.view permission
  const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
  const allowedSellers = await getSellersWithPermission(payload, user.id, 'order.view');

  const orders = await getIncomingOrders(allowedSellers)
  
  // Fetch seller's warehouses
  const warehousesRes = await payload.find({
    collection: "warehouses" as never,
    where: {
      user: { equals: user.id },
    },
    limit: 100,
  })

  return <IncomingOrdersClient orders={orders} warehouses={warehousesRes.docs} />
}
