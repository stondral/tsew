"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ChevronRight, Calendar, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MyOrdersPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !user?.id) { // Ensure user.id is available
      setIsLoading(false); // Stop loading if not authenticated or user.id is missing
      return;
    }

    const fetchOrders = async () => {
      try {
        // Fetch orders directly from the API, passing the user ID
        const res = await fetch(`/api/orders/list?userId=${user.id}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (e) {
        console.error("Failed to fetch orders", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, isAuthLoading, user?.id]); // Add user.id to dependencies

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <h1 className="text-xl font-medium text-gray-600">Loading your orders...</h1>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 text-center px-6">
        <div className="bg-orange-50 p-6 rounded-full">
            <Lock className="w-12 h-12 text-orange-600" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
            <p className="text-gray-500 max-w-sm">You need to be logged in to view your order history.</p>
        </div>
        <Button asChild className="bg-orange-600 hover:bg-orange-700 font-semibold px-8 py-6 rounded-xl text-lg">
            <Link href="/auth">Sign In Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <Link href="/profile" className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
               </Link>
               <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
            </div>
            <p className="text-gray-500 font-medium">{orders.length} orders found</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Looks like you haven&apos;t placed any orders yet. Start shopping to fill this list!</p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700 px-8 py-6 rounded-xl font-bold text-lg">
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block group"
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Items Preview */}
                    <div className="flex -space-x-3">
                         {/* We could show small thumbnails if we had them in the list */}
                         <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                            <Package className="w-6 h-6 text-orange-600" />
                         </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        <div className="flex items-center text-sm text-gray-400 gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.orderDate).toLocaleDateString("en-IN", {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                          })}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {order.items.length === 1
                           ? order.items[0].productName
                           : `${order.items[0].productName} + ${order.items.length - 1} more items`
                        }
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:text-right">
                      <div className="flex flex-col items-start md:items-end gap-1">
                          <p className="text-xl font-black text-gray-900">₹{order.total.toLocaleString("en-IN")}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={cn("rounded-md", order.paymentStatus === 'paid' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200")}>
                                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="rounded-md border-orange-200 text-orange-700 bg-orange-50 font-semibold">
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple fallback if Badge is missing
import { cn } from "@/lib/utils";
function Lock({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
