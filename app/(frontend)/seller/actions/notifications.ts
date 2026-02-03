"use server"

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

interface User {
  id: string;
  role?: string;
}

interface Order {
  id: string;
  orderNumber?: string;
  createdAt?: string;
}

interface Feedback {
  id: string;
  name?: string;
  comment?: string;
  createdAt?: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: string;
  read: boolean;
  priority: string;
}

export async function getSellerNotificationsAction() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || ((user as User).role !== 'seller' && (user as User).role !== 'admin')) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    // 1. Fetch pending orders (real "new order" notifications)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = await (payload as any).find({
      collection: "orders",
      where: {
        seller: { equals: user.id },
        status: { equals: "PENDING" }
      },
      limit: 5,
      sort: "-createdAt",
    });

    // 2. Fetch recent feedback (real "customer message" notifications)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feedback = await (payload as any).find({
      collection: "feedback",
       // Note: Check if feedback has a seller field or if it's general
      limit: 5,
      sort: "-createdAt",
    });

    // 3. Fetch products with low stock (real "alert" notifications)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lowStockProducts = await (payload as any).find({
      collection: "products",
      where: {
        seller: { equals: user.id },
        stock: { less_than: 10 }
      },
      limit: 5,
    });

    // Transform these into the notification format
    const realNotifications: Notification[] = [
      ...orders.docs.map((o: Order) => ({
        id: `order-${o.id}`,
        title: "New Order Pending",
        description: `Order #${o.orderNumber || o.id.substring(0, 8)} needs review`,
        time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
        type: "order",
        read: false,
        priority: "high"
      })),
      ...feedback.docs.map((f: Feedback) => ({
        id: `feedback-${f.id}`,
        title: "New Feedback",
        description: `${f.name || 'A customer'} left a message: ${f.comment?.substring(0, 30)}...`,
        time: f.createdAt ? new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
        type: "message",
        read: false,
        priority: "medium"
      })),
      ...lowStockProducts.docs.map((p: Product) => ({
        id: `stock-${p.id}`,
        title: "Low Stock Alert",
        description: `${p.name} is running low (${p.stock} remaining)`,
        time: "Now",
        type: "alert",
        read: false,
        priority: "high"
      }))
    ];

    return { ok: true, notifications: realNotifications };
  } catch (error) {
    console.error("Failed to fetch seller notifications:", error);
    return { ok: false, error: "Failed to fetch notifications" };
  }
}
