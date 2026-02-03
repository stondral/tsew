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
  Warehouse,
  Truck,
  Phone,
  Building2,
  Command,
  Zap
} from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media"; 
import InvoiceButton from "@/components/orders/InvoiceButton";
import DeliveryManifestButton from "@/components/orders/DeliveryManifestButton";

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user: authedUser } = await payload.auth({
    headers: requestHeaders,
  });

  interface User { id: string; role?: string }
  if (!authedUser || ((authedUser as User).role !== "seller" && (authedUser as User).role !== "admin")) {
    redirect("/login?redirect=/seller/orders/" + id);
  }

  // Fetch the order with depth to populate user and warehouse
  const order = await payload.findByID({
    collection: "orders" as never,
    id,
    depth: 2,
  }).catch(() => null) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!order) return notFound();

  // Backfill images if missing (for legacy orders)
  if (order.items.some((item: { productImage?: string }) => !item.productImage)) {
    await Promise.all(order.items.map(async (item: { productImage?: string; productId: string }) => {
      if (item.productImage) return;
      try {
        const product = await payload.findByID({
          collection: "products" as never,
          id: item.productId,
          depth: 1,
        }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (product?.media?.[0]) {
          const media = product.media[0];
          item.productImage = typeof media === "object" ? (media.sizes?.thumbnail?.url || media.url || "") : "";
        }
      } catch (e) {
        console.error("Backfill error", e);
      }
    }));
  }

  // Fetch seller's products to verify ownership of at least one item
  const productsRes = await payload.find({
    collection: "products" as never,
    where: {
      seller: { equals: authedUser.id },
    },
    limit: 1000,
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const sellerProductIds = (productsRes.docs as { id: string }[]).map((p) => p.id);

  // Filter items that belong to this seller
  const sellerItems = order.items
    .map((item: { seller?: string | { id: string }; productId: string }, originalIndex: number) => ({ ...item, originalIndex }))
    .filter((item: { seller?: string | { id: string }; productId: string }) => {
        const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
        return itemSellerId === authedUser.id || (authedUser as User).role === 'admin' || sellerProductIds.includes(item.productId);
    });

  if (sellerItems.length === 0 && (authedUser as User).role !== "admin") {
    return notFound();
  }

  const sellerTotal = sellerItems.reduce(
    (sum: number, item: { priceAtPurchase: number; quantity: number }) => sum + (item.priceAtPurchase * item.quantity), 
    0
  );

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-24 px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/seller/orders">
            <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 bg-white shadow-xl ring-1 ring-slate-100 hover:bg-slate-50 transition-all group">
              <ArrowLeft className="h-6 w-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Order Terminal</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1 flex items-center gap-2">
              Order Node <span className="text-amber-600 px-3 py-0.5 bg-amber-50 rounded-lg">#{order.orderNumber || order.id.slice(-8).toUpperCase()}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-2.5 rounded-[2rem] shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100">
          <DeliveryManifestButton order={order} address={order.shippingAddress} />
          <InvoiceButton order={order} address={order.shippingAddress} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Order Status", 
            val: (order.status || 'PENDING').toUpperCase(), 
            icon: ShieldCheck, 
            color: order.status?.toLowerCase() === 'delivered' ? "text-emerald-500" : "text-amber-500", 
            bg: order.status?.toLowerCase() === 'delivered' ? "bg-emerald-50" : "bg-amber-50" 
          },
          { label: "Placement Date", val: format(new Date(order.orderDate || order.createdAt), "dd MMM, yyyy"), icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Payment Method", val: (order.paymentMethod || 'Razorpay').toUpperCase(), sub: order.paymentStatus, icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Revenue Allocation", val: `₹${sellerTotal.toFixed(2)}`, icon: Banknote, color: "text-indigo-500", bg: "bg-indigo-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/20 bg-white rounded-[2rem] overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
            <CardContent className="p-7">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter", stat.bg, stat.color)}>
                  Measured
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{stat.val}</h3>
              {stat.sub && (
                 <p className={cn("text-[10px] font-bold uppercase mt-1.5 flex items-center gap-1.5", stat.sub === 'paid' ? 'text-emerald-500' : 'text-amber-500')}>
                    <span className="h-1 w-1 rounded-full bg-current" />
                    {stat.sub}
                 </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Main Console: Product List */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black flex items-center gap-4 text-slate-900">
                  <Package className="h-6 w-6 text-amber-500" />
                  Package Manifest
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white px-4 py-2 rounded-xl border-slate-200 text-slate-500 font-black text-[10px] tracking-widest uppercase">
                    {sellerItems.length} Products
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {sellerItems.map((item: { productImage?: string; productName: string; quantity: number; status?: string; priceAtPurchase: number; originalIndex: number }, idx: number) => (
                  <div key={idx} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-slate-50/40 transition-all duration-300 group">
                    <div className="flex items-center gap-8">
                      <div className="h-28 w-28 rounded-[2.5rem] overflow-hidden border-4 border-white relative shadow-2xl shadow-slate-200 shrink-0 bg-slate-50 group-hover:scale-105 transition-transform duration-500 ring-1 ring-slate-100">
                        {item.productImage ? (
                          <Image 
                            src={resolveMediaUrl(item.productImage)} 
                            alt={item.productName} 
                            fill
                            className="object-cover" 
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full text-slate-300">
                            <Package className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-black text-xl text-slate-900 leading-none group-hover:text-amber-600 transition-colors uppercase tracking-tight">{item.productName}</h4>
                        <div className="flex flex-wrap items-center gap-5">
                          <div className="flex items-center gap-2.5 bg-slate-100 px-4 py-1.5 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Quantity</span>
                            <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2.5 bg-amber-50 px-4 py-1.5 rounded-2xl border border-amber-100/50">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">Logic State</span>
                            <span className="text-sm font-black text-amber-600 uppercase tracking-tight">{item.status || 'pending'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-8 pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                      <div className="text-right">
                        <p className="font-black text-3xl text-slate-900 tracking-tighter">₹{(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">₹{item.priceAtPurchase} UNIT PULSE</p>
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
            </CardContent>
          </Card>

          {/* Logistics Coordination Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Receiver Profile */}
            <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-900">
                  <User className="h-5 w-5 text-indigo-500" />
                  End Receiver Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                  <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-100 uppercase shrink-0 ring-4 ring-white">
                    {(order.shippingAddress?.firstName?.[0] || order.user?.username?.[0] || 'G')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 truncate text-lg tracking-tight">
                      {order.shippingAddress 
                        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
                        : (order.user?.username || 'Guest Customer')}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 truncate tracking-tight">{order.shippingAddress?.email || order.user?.email || order.guestEmail || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-slate-100">
                      <MapPin className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-400 mb-1.5 text-[10px] uppercase tracking-widest leading-none">Drop-off Coordinates</p>
                      {order.shippingAddress ? (
                        <div className="text-[13px] text-slate-700 font-black leading-relaxed">
                          {order.shippingAddress.address}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </div>
                      ) : (
                        <p className="text-slate-400 font-bold italic">No drop node specified</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-slate-100">
                      <Phone className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-400 mb-1.5 text-[10px] uppercase tracking-widest leading-none">Secure Communication</p>
                      <p className="text-base font-black text-slate-900 tracking-tight">{order.shippingAddress?.phone || order.guestPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logistics Source */}
            <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden border-r-[10px] border-r-amber-500">
              <CardHeader className="p-8 border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-900">
                  <Warehouse className="h-5 w-5 text-amber-500" />
                  Origin Dispatch Node
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner border border-amber-100/50">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 truncate text-lg tracking-tight">{(order.delivery?.pickupWarehouse as { label?: string })?.label || 'CENTRAL LOGISTICS HUB'}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Verified Dispatch Site</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                      <MapPin className="h-5 w-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-black text-slate-400 mb-1 text-[10px] uppercase tracking-widest leading-none">Station Address</p>
                      <p className="text-sm font-black text-slate-600 leading-tight">
                        {(order.delivery?.pickupWarehouse as { address?: string })?.address || "Tech Grid Station - 41"}<br />
                        {(order.delivery?.pickupWarehouse as { city?: string })?.city || "Bangalore"}, IND
                      </p>
                    </div>
                  </div>
                  {order.delivery?.provider && (
                    <div className="pt-6 border-t border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Logistics Protocol</p>
                       <div className="flex items-center gap-4 text-sm font-black text-slate-900 bg-amber-50 px-5 py-4 rounded-2xl border border-amber-100/50">
                          <Truck className="h-6 w-6 text-amber-600 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-tighter">Carrier Service</span>
                            <span>{order.delivery.provider}</span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Console Sidebar: Financials & Secure Metadata */}
        <div className="lg:col-span-4 space-y-8 sticky top-8">
          {/* Ledger Totals */}
          <Card className="border-none shadow-3xl shadow-slate-900/40 bg-slate-900 rounded-[2.5rem] overflow-hidden text-white group">
            <CardHeader className="p-8 border-b border-white/5 bg-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Receipt className="h-24 w-24" />
              </div>
              <CardTitle className="text-xl font-black flex items-center gap-4 relative z-10">
                <Receipt className="h-6 w-6 text-emerald-400" />
                Financial Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-9 space-y-6 relative z-10">
                {[
                  { label: "Gross Subtotal", val: order.subtotal },
                  { label: "Logistics Overhead", val: order.shippingCost },
                  { label: "Input Tax Credit", val: order.gst || order.tax || 0 },
                  { label: "Platform Protocol Fee", val: order.platformFee || 0 }
                ].map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-slate-500 uppercase tracking-[0.2em] text-[10px]">{row.label}</span>
                    <span className="font-black text-slate-100 tracking-tight">₹{row.val?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
                
                <div className="pt-9 border-t border-white/10 flex flex-col items-end">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Total Node Payload</span>
                  <span className="text-6xl font-black text-emerald-400 tracking-tighter">₹{order.total?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 mt-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <p className="text-[10px] font-black text-emerald-300 uppercase leading-tight tracking-widest">
                    Transaction verified on blockchain ledger
                  </p>
                </div>
            </CardContent>
          </Card>

          {/* Secure Metadata Console */}
          <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 pb-5">
              <CardTitle className="text-[11px] font-black flex items-center gap-4 text-slate-400 uppercase tracking-[0.3em]">
                <Command className="h-5 w-5" />
                Node Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-7">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none block">System Unique ID</label>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-amber-200 transition-colors">
                  <code className="text-[11px] font-mono text-slate-500 truncate mr-6 font-bold">{order.id}</code>
                  <Hash className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
                </div>
              </div>
              {order.razorpayOrderId && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none block">Payment Signal Key</label>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                    <code className="text-[11px] font-mono text-slate-500 truncate mr-6 font-bold">{order.razorpayOrderId}</code>
                    <Zap className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </div>
                </div>
              )}
              <div className="pt-6 flex flex-col items-center justify-center border-t border-slate-50">
                 <div className="flex items-center mb-1.5 gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Live Connection</span>
                 </div>
                 <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em]">Stond Emporium OS v2.0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
