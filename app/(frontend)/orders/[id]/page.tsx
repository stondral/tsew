// app/(frontend)/orders/[id]/page.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Calendar, 
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl, cn } from "@/lib/utils";
import Image from "next/image";
import InvoiceButton from "@/components/orders/InvoiceButton";
import { HelpButton } from "@/components/orders/HelpButton";
import { ShipmentTracking } from "@/components/orders/ShipmentTracking";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload as any).findByID({
    collection: "orders",
    id,
    depth: 0, // Optimized: no relationship population needed, order contains all data
  });

  if (!order || (typeof order.user === 'string' ? order.user : order.user.id) !== user.id) {
    notFound();
  }

  // Images should be stored during order creation, not backfilled on every page load

  const address = order.shippingAddress;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "PENDING": return <Clock className="w-5 h-5 text-amber-500" />;
      case "SHIPPED": return <Truck className="w-5 h-5 text-blue-500" />;
      case "ACCEPTED": return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 py-4 md:py-12 px-3 md:px-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 md:mb-8">
           <Link 
             href="/orders" 
             className="inline-flex items-center justify-center text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors bg-white px-4 py-2.5 md:py-2 rounded-xl border border-gray-100 shadow-sm"
           >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
           </Link>
            <div className="flex-1 sm:flex-none">
              <InvoiceButton order={order} address={address} />
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Order Identity & Status */}
            <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 hidden md:block">
                    <ShieldCheck className="w-16 h-16 text-gray-50 opacity-10" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 px-2 md:px-3 py-0.5 md:py-1 font-mono text-xs md:text-sm">
                            {order.orderNumber}
                        </Badge>
                        <div className="flex items-center text-xs md:text-sm text-gray-500">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" />
                            <span className="hidden sm:inline">
                              {new Date(order.orderDate).toLocaleDateString("en-IN", {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                              })}
                            </span>
                            <span className="sm:hidden">
                              {new Date(order.orderDate).toLocaleDateString("en-IN", {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                              })}
                            </span>
                        </div>
                    </div>
                    
                    {order.discountCode && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-2 md:px-3 py-0.5 md:py-1 text-xs mt-2">
                        💰 {order.discountCode} Applied
                      </Badge>
                    )}
                    
                    <h1 className="text-lg md:text-3xl font-extrabold text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                        Order Details
                        <div className="hidden md:block h-2 w-2 rounded-full bg-gray-300" />
                        <span className="text-gray-400 text-sm md:text-3xl">#{order.id.slice(-6)}</span>
                    </h1>

                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                        <div className="p-2.5 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
                             <p className="text-[9px] md:text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Status</p>
                              <div className="flex items-center gap-1 md:gap-2">
                                {getStatusIcon(order.status)}
                                <span className="font-bold text-gray-800 uppercase tracking-wider text-[9px] md:text-xs">{order.status}</span>
                              </div>
                        </div>
                        <div className="p-2.5 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
                             <p className="text-[9px] md:text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Payment</p>
                             <div className="flex items-center gap-1 md:gap-2">
                                <CreditCard className="w-3 h-3 md:w-5 md:h-5 text-gray-400" />
                                <span className={cn("font-bold text-[9px] md:text-xs", order.paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-800')}>
                                    {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-3 md:p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-sm md:text-base text-gray-800 flex items-center gap-1.5 md:gap-2">
                        <Package className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                        Order Items
                    </h3>
                    <span className="text-xs md:text-sm font-medium text-gray-500">{order.items.length} items</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 md:p-6 flex items-start sm:items-center gap-3 md:gap-6 hover:bg-gray-50/30 transition-colors overflow-hidden">
                            <div className="w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 border border-orange-100 overflow-hidden relative">
                                 {item.productImage ? (
                                   <Image 
                                     src={resolveMediaUrl(item.productImage)} 
                                     alt={item.productName} 
                                     fill
                                     className="object-cover" 
                                   />
                                 ) : (
                                   <Package className="w-6 h-6 md:w-8 md:h-8 text-orange-200" />
                                 )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs md:text-base text-gray-900 mb-1 line-clamp-1">{item.productName}</h4>
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-4">
                                    <p className="text-[10px] md:text-sm text-gray-500 font-medium whitespace-nowrap">Qty: <span className="text-gray-800 font-bold">{item.quantity}</span></p>
                                    <div className="hidden sm:block h-1 w-1 bg-gray-300 rounded-full" />
                                    <p className="text-[10px] md:text-sm text-gray-500 font-medium whitespace-nowrap">Price: <span className="text-gray-800 font-bold">₹{item.priceAtPurchase.toLocaleString("en-IN")}</span></p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-black text-xs md:text-base text-gray-900">₹{(item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4 md:space-y-6">
            {/* Live tracking (Replacing static Shipment Radar) */}
            {order.delivery?.trackingId && (
              <ShipmentTracking orderId={order.id} trackingId={order.delivery.trackingId} />
            )}

            {/* Delivery Address */}
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-sm md:text-base text-gray-800 mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    Delivery Address
                </h3>
                {address ? (
                    <div className="space-y-2">
                         <p className="font-bold text-sm md:text-base text-gray-900">{address.firstName} {address.lastName}</p>
                         <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            {address.address}<br />
                            {address.city}, {address.state} - {address.postalCode}
                         </p>
                         <div className="pt-2 border-t border-gray-100 mt-3 md:mt-4">
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase mb-1">Phone Number</p>
                            <p className="text-xs md:text-sm text-gray-800 font-medium">{address.phone}</p>
                         </div>
                    </div>
                ) : (
                    <p className="text-xs md:text-sm text-gray-400 italic">Address details unavailable</p>
                )}
            </div>

            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-xl shadow-gray-200">
                <h3 className="font-bold text-sm md:text-base mb-4 md:mb-6 flex items-center gap-1.5 md:gap-2">
                    <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                    Payment Summary
                </h3>
                <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
                    <div className="flex justify-between text-gray-400">
                        <span>Items Subtotal</span>
                        <span className="text-gray-200">₹{order.subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Shipping</span>
                        <span className="text-green-400 font-medium">{order.shippingCost === 0 ? "FREE" : `₹${order.shippingCost}`}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Tax (18% GST)</span>
                        <span className="text-gray-200">₹{order.gst.toLocaleString("en-IN")}</span>
                    </div>
                    {order.platformFee > 0 && (
                        <div className="flex justify-between text-gray-400">
                            <span>Platform Fee</span>
                            <span className="text-gray-200">₹{order.platformFee}</span>
                        </div>
                    )}
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-green-400">
                            <div className="min-w-0">
                                <span className="text-xs md:text-sm">{order.discountSource === 'seller' ? 'Seller Discount' : 'Store Reward'}</span>
                                {order.discountCode && (
                                    <span className="ml-1 md:ml-2 text-[10px] md:text-xs font-mono bg-green-500/20 px-1.5 md:px-2 py-0.5 rounded">
                                        {order.discountCode}
                                    </span>
                                )}
                            </div>
                            <span className="font-medium flex-shrink-0">-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-700/50 pt-3 md:pt-4 flex justify-between">
                        <span className="font-bold text-white text-sm md:text-lg">Total Amount</span>
                        <span className="font-black text-orange-400 text-base md:text-xl">₹{order.total.toLocaleString("en-IN")}</span>
                    </div>
                </div>
                
                <Badge className="w-full mt-4 md:mt-6 py-2 bg-orange-600/20 text-orange-400 border-none hover:bg-orange-600/30 justify-center text-xs md:text-sm">
                    Payment via {order.paymentMethod.toUpperCase()}
                </Badge>
            </div>

            <Button asChild variant="outline" className="w-full border-gray-200 rounded-2xl h-14 font-bold text-gray-600 hover:bg-white hover:border-gray-300">
                <Link href="/contact">Contact Support</Link>
            </Button>

            <HelpButton orderId={order.id} orderNumber={order.orderNumber} />
          </div>
        </div>
      </div>
    </div>
  );
}
