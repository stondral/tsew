import { getPayload } from "payload"
import config from "@/payload.config"
import { headers } from "next/headers"
import { getIncomingOrders } from "@/lib/orders"
import IncomingOrdersClient from "./IncomingOrdersClient"
import { redirect } from "next/navigation"

export default async function IncomingOrdersPage() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== 'seller' && (user as any).role !== 'admin')) {
    redirect("/auth/login?redirect=/seller/orders/incoming")
  }

  const orders = await getIncomingOrders(user.id)

  return <IncomingOrdersClient orders={orders} />
}
