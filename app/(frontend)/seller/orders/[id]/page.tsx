import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusUpdate } from "@/components/seller/StatusUpdate";
import { 
  ArrowLeft, 
  Package, 
  CreditCard, 
  User, 
  MapPin, 
  Calendar,
  Hash,
  Receipt,
  ShieldCheck,
  Banknote,
  Info
} from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface User {
  id: string;
  role: 'admin' | 'seller' | 'user';
  email: string;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
    redirect("/login?redirect=/seller/orders/" + id);
  }

  // Fetch the order
  let order;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order = await (payload as any).findByID({
      collection: "orders",
      id,
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return notFound();
  }

  if (!order) return notFound();

  // Fetch seller's products to verify ownership of at least one item (fallback for legacy orders)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsRes = await (payload as any).find({
    collection: "products",
    where: {
      seller: { equals: user.id },
    },
    limit: 1000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerProductIds = (productsRes.docs as any[]).map((p: any) => p.id);

  // Filter items that belong to this seller
  const sellerItems = order.items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any, originalIndex: number) => ({ ...item, originalIndex }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((item: any) => {
        const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return itemSellerId === user.id || (user as any).role === 'admin' || sellerProductIds.includes(item.productId);
    });

  // If seller doesn't own any items in this order, deny access (unless admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (sellerItems.length === 0 && (user as any).role !== "admin") {
    return notFound();
  }

  const sellerTotal = sellerItems.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, item: any) => sum + ((item as any).priceAtPurchase * (item as any).quantity), 
    0
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
            <div className="flex items-center gap-6 mb-8">
              <Link href="/seller/orders">
                <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 bg-white shadow-xl ring-1 ring-slate-100 hover:bg-slate-50 transition-all">
                  <ArrowLeft className="h-6 w-6 text-slate-600" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">Order Detail</h1>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
                  Viewing details for Order <span className="text-amber-600">#{order.id.substring(order.id.length - 8).toUpperCase()}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                {/* Order Items */}
                <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black flex items-center gap-3">
                        <Package className="h-6 w-6 text-amber-500" />
                        Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {sellerItems.map((item: any, idx: number) => (
                            <div key={idx} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                        <Package className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-slate-900">{item.productName}</h4>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-slate-400">Qty: {item.quantity}</p>
                                            <span className="text-slate-200">|</span>
                                            <p className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                                {item.status || 'pending'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <p className="font-black text-slate-900">₹{(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">₹{item.priceAtPurchase} / Unit</p>
                                    </div>
                                    <StatusUpdate 
                                        orderId={order.id} 
                                        itemIdx={item.originalIndex} 
                                        currentStatus={item.status || 'pending'} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-8 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Seller Subtotal</span>
                        <span className="text-2xl font-black text-slate-900">₹{sellerTotal.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black flex items-center gap-3">
                        <Receipt className="h-6 w-6 text-emerald-500" />
                        Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Subtotal</span>
                            <span className="font-black text-slate-900">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Shipping Cost</span>
                            <span className="font-black text-slate-900">₹{order.shippingCost?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tax</span>
                            <span className="font-black text-slate-900">₹{order.tax?.toFixed(2) || '0.00'}</span>
                        </div>
                        {order.platformFee > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Platform Fee</span>
                                <span className="font-black text-slate-900">₹{order.platformFee?.toFixed(2) || '0.00'}</span>
                            </div>
                        )}
                        <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Order Total</span>
                            <span className="text-3xl font-black text-amber-600">₹{order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 italic text-right mt-2">
                            * Totals reflect items from all sellers in this order
                        </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction Details */}
                <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-indigo-500" />
                        Transaction Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</label>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    {order.paymentMethod === 'cod' ? <Banknote className="h-5 w-5 text-emerald-500" /> : <CreditCard className="h-5 w-5 text-indigo-500" />}
                                    <span className="font-black text-slate-900 uppercase text-xs">{order.paymentMethod}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Number</label>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Hash className="h-5 w-5 text-slate-400" />
                                    <span className="font-black text-slate-900 text-xs">{order.orderNumber}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {order.razorpayOrderId && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Razorpay Order ID</label>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <Info className="h-5 w-5 text-slate-400" />
                                        <span className="font-black text-slate-900 text-[10px] font-mono">{order.razorpayOrderId}</span>
                                    </div>
                                </div>
                            )}
                            {order.razorpayPaymentId && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Razorpay Payment ID</label>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <Info className="h-5 w-5 text-slate-400" />
                                        <span className="font-black text-slate-900 text-[10px] font-mono">{order.razorpayPaymentId}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1 space-y-8">
                {/* Order Status */}
                <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Status</label>
                            <Badge className={cn(
                                "w-full justify-center h-12 text-sm font-black rounded-xl uppercase tracking-widest border-none",
                                order.status === 'success' || order.status === 'delivered' ? 'bg-emerald-500 text-white' : 
                                order.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                            )}>
                                {order.status}
                            </Badge>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Status</label>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                <span className="font-black text-slate-900 uppercase text-xs">{order.paymentStatus}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Date</label>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <span className="font-black text-slate-900 text-xs">
                                    {format(new Date(order.orderDate), "PPP p")}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Information */}
                <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                         <CardTitle className="text-lg font-black flex items-center gap-3">
                            <User className="h-5 w-5 text-blue-500" />
                            Customer
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center font-black">
                                {order.customer?.username ? (order.customer.username as string)[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900">{order.customer?.username || 'Guest Customer'}</h4>
                                <p className="text-xs font-bold text-slate-400">{order.customer?.email || order.guestEmail || 'No email provided'}</p>
                                {(order.customer?.phone || order.guestPhone) && (
                                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                    Phone: {order.customer?.phone || order.guestPhone}
                                  </p>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50 space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div className="text-xs">
                                    <p className="font-black text-slate-900 mb-1">Shipping Address</p>
                                    {order.shippingAddress ? (
                                        <div className="text-slate-500 font-bold leading-relaxed">
                                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                                            {order.shippingAddress.address}<br />
                                            {order.shippingAddress.apartment && <>{order.shippingAddress.apartment}<br /></>}
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                                            {order.shippingAddress.country}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic font-bold">Address not specified</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </div>
            </div>
          </div>
  );
}
