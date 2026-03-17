"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
}

export default function OrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Looks like you haven&apos;t placed any orders yet. Start shopping to fill this list!</p>
        <Link 
          href="/products" 
          className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="block group"
        >
          <div className="bg-white p-3 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 overflow-hidden">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Top Row: Image + Order Info */}
              <div className="flex items-start gap-3 md:gap-4 min-w-0">
                {/* Items Preview */}
                <div className="flex-shrink-0">
                   {order.items?.[0]?.productImage ? (
                     <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-white shadow-sm overflow-hidden relative">
                       <Image 
                         src={resolveMediaUrl(order.items[0].productImage)} 
                         alt={order.items[0].productName} 
                         fill
                         className="object-cover" 
                       />
                     </div>
                   ) : (
                     <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                       <Package className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                     </div>
                   )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs md:text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      {order.orderNumber}
                    </span>
                    <div className="flex items-center text-xs md:text-sm text-gray-400 gap-1">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">
                        {new Date(order.orderDate).toLocaleDateString("en-IN", {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })}
                      </span>
                      <span className="sm:hidden">
                        {new Date(order.orderDate).toLocaleDateString("en-IN", {
                            day: 'numeric',
                            month: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm md:text-lg text-gray-900 line-clamp-1">
                    {order.items.length === 1
                       ? order.items[0].productName
                       : `${order.items[0].productName} + ${order.items.length - 1} more`
                    }
                  </h3>
                </div>
              </div>

              {/* Bottom Row: Price + Status */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
                <div className="flex flex-col gap-1">
                    <p className="text-base md:text-xl font-black text-gray-900">₹{order.total.toLocaleString("en-IN")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={cn("rounded-md text-[10px] md:text-xs px-1.5 py-0", order.paymentStatus === 'paid' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200")}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="rounded-md border-orange-200 text-orange-700 bg-orange-50 font-semibold uppercase tracking-wider text-[9px] md:text-[10px] px-1.5 py-0">
                          {order.status}
                      </Badge>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
