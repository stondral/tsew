"use client";

import { useEffect, useState } from "react";
import { Package, Calendar, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/utils";

interface OrderItem {
  productName: string;
  productImage?: string;
}

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  total?: number;
  items?: OrderItem[];
}

interface OrderHistoryProps {
  customerId: string;
  selectedOrderId?: string;
}

export function OrderHistory({ customerId, selectedOrderId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/admin/customer-orders?customerId=${customerId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.docs || []);
      } catch (err) {
        console.error("Failed to fetch customer orders:", err);
        setError("Failed to load order history");
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchOrders();
    }
  }, [customerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700 border-green-300";
      case "SHIPPED":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "ACCEPTED":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "PENDING":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-500" />
          Order History
        </h4>
        <Badge variant="outline" className="text-[8px] font-black">
          {orders.length} Orders
        </Badge>
      </div>

      {isLoading ? (
        <div className="px-4 py-6 text-center">
          <div className="inline-flex items-center justify-center h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-r-orange-600 mb-2" />
          <p className="text-xs font-bold text-slate-400">Loading orders...</p>
        </div>
      ) : error ? (
        <div className="px-4 py-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="px-4 py-6 text-center opacity-50">
          <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {orders.map((order) => (
            <div
              key={order.id}
              className={cn(
                "p-3 rounded-xl border-2 transition-all cursor-pointer group",
                selectedOrderId === order.id
                  ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-[10px] font-black text-orange-500 uppercase">
                  #{order.orderNumber}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-[7px] font-black border", getStatusColor(order.status))}
                >
                  {order.status}
                </Badge>
              </div>

              <div className="flex gap-2 mb-2">
                {order.items?.slice(0, 3).map((item: OrderItem, idx: number) => (
                  <div
                    key={idx}
                    className="h-6 w-6 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0 overflow-hidden"
                  >
                    {item.productImage ? (
                      <Image
                        src={resolveMediaUrl(item.productImage)}
                        alt={item.productName}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-3 w-3 text-slate-300" />
                    )}
                  </div>
                ))}
                {(order.items?.length ?? 0) > 3 && (
                  <div className="h-6 w-6 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[7px] font-black text-slate-500">
                      +{(order.items?.length ?? 0) - 3}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[8px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  ₹{order.total?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
