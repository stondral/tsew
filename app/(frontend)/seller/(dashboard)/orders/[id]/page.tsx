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
  Zap,
  ShieldAlert,
  Lock
} from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media"; 
import InvoiceButton from "@/components/orders/InvoiceButton";
import DeliveryManifestButton from "@/components/orders/DeliveryManifestButton";
import PrintLabelButton from "@/components/orders/PrintLabelButton";
import { ShipmentTracking } from "@/components/orders/ShipmentTracking";

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
  if (!authedUser || ((authedUser as User).role !== "seller" && (authedUser as User).role !== "admin" && (authedUser as User).role !== "sellerEmployee")) {
    redirect("/auth?redirect=/seller/orders/" + id);
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

  // Fetch sellers where user has order.view permission
  const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
  const allowedSellers = await getSellersWithPermission(payload, authedUser.id, 'order.view');

  // Filter items that belong to this seller's organizations
  const sellerItems = order.items
    .map((item: { seller?: string | { id: string }; productId: string }, originalIndex: number) => ({ ...item, originalIndex }))
    .filter((item: { seller?: string | { id: string }; productId: string }) => {
        const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
        return (authedUser as User).role === 'admin' || (itemSellerId && allowedSellers.includes(itemSellerId));
    });

  if (sellerItems.length === 0 && (authedUser as User).role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="h-24 w-24 bg-rose-100 rounded-[2rem] flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform duration-500">
            <Lock className="h-10 w-10 text-rose-500" />
          </div>
          <div className="absolute -top-2 -right-2 h-8 w-8 bg-amber-50 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order Access Restricted</h2>
          <p className="text-slate-500 font-bold leading-relaxed">
            You don&apos;t have sufficient permissions to view this order. Please <span className="text-amber-600">contact your administrator</span> to verify your assignment.
          </p>
        </div>

        <Link href="/seller/orders">
          <Button variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const sellerTotal = sellerItems.reduce(
    (sum: number, item: { priceAtPurchase: number; quantity: number }) => sum + (item.priceAtPurchase * item.quantity), 
    0
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 lg:px-8 pt-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link href="/seller/orders">
            <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 bg-white shadow-lg ring-1 ring-slate-100 hover:bg-slate-50 transition-all group">
              <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Order Terminal</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 flex items-center gap-3">
              Node Identification <span className="text-amber-600 px-3 py-0.5 bg-amber-50 rounded-lg ring-1 ring-amber-100/50 italic font-medium">#{order.orderNumber || order.id.slice(-8).toUpperCase()}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-100/50 shrink-0">
          <DeliveryManifestButton order={order} address={order.shippingAddress} />
          {order.delivery?.trackingId && (
            <PrintLabelButton trackingId={order.delivery.trackingId} />
          )}
          <InvoiceButton order={order} address={order.shippingAddress} />
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Mission Status", 
            val: (order.status || 'PENDING').toUpperCase(), 
            icon: ShieldCheck, 
            color: order.status?.toLowerCase() === 'delivered' ? "text-emerald-500" : "text-amber-500", 
            bg: order.status?.toLowerCase() === 'delivered' ? "bg-emerald-50" : "bg-amber-50" 
          },
          { label: "Dispatch Date", val: format(new Date(order.orderDate || order.createdAt), "dd MMM, yyyy"), icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Financial Protocol", val: (order.paymentMethod || 'Razorpay').toUpperCase(), sub: order.paymentStatus, icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Seller Yield", val: `₹${sellerTotal.toLocaleString()}`, icon: Banknote, color: "text-indigo-500", bg: "bg-indigo-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-200/20 bg-white rounded-3xl overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", stat.bg, stat.color)}>
                  LIVE
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{stat.val}</h3>
              {stat.sub && (
                 <p className={cn("text-[10px] font-bold uppercase mt-2 flex items-center gap-2", stat.sub === 'paid' ? 'text-emerald-500' : 'text-amber-500')}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {stat.sub}
                 </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Main Console: Content Hub */}
        <div className="lg:col-span-8 space-y-8">
          {/* Manifest Console */}
          <Card className="border border-slate-100 shadow-xl shadow-slate-200/30 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em]">Operational Payload</p>
                  <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900">
                    <Package className="h-5 w-5 text-amber-500" />
                    Package Manifest
                  </CardTitle>
                </div>
                <Badge variant="outline" className="bg-white px-4 py-1.5 rounded-xl border-slate-200 text-slate-900 font-black text-[10px] tracking-widest uppercase shadow-sm">
                  {sellerItems.length} Items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {sellerItems.map((item: { productImage?: string; productName: string; quantity: number; status?: string; priceAtPurchase: number; originalIndex: number }, idx: number) => (
                  <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all duration-300 group">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-white relative shadow-lg shadow-slate-200 shrink-0 bg-slate-50 group-hover:scale-105 transition-transform duration-500 ring-1 ring-slate-100">
                        {item.productImage ? (
                          <Image 
                            src={resolveMediaUrl(item.productImage)} 
                            alt={item.productName} 
                            fill
                            className="object-cover" 
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full text-slate-200">
                            <Package className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-black text-lg text-slate-900 leading-tight group-hover:text-amber-600 transition-colors uppercase tracking-tight">{item.productName}</h4>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Qty</span>
                            <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100/50">
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Status</span>
                            <span className="text-sm font-black text-amber-600 uppercase tracking-tight">{item.status || 'pending'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-6 pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                      <div className="text-right">
                        <p className="font-black text-2xl text-slate-900 tracking-tighter">₹{(item.priceAtPurchase * item.quantity).toLocaleString()}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1">@ ₹{item.priceAtPurchase.toLocaleString()}</p>
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

          {/* Logistics Coordination Console */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Destination Card */}
              <Card className="border border-slate-100 shadow-xl shadow-slate-200/30 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50 pb-4">
                  <CardTitle className="text-base font-black flex items-center gap-3 text-slate-900 uppercase tracking-tight">
                    <User className="h-5 w-5 text-indigo-500" />
                    Receiver
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="h-12 w-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 uppercase shrink-0">
                      {(order.shippingAddress?.firstName?.[0] || order.user?.username?.[0] || 'G')}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 truncate text-base tracking-tight">
                        {order.shippingAddress 
                          ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
                          : (order.user?.username || 'Guest Customer')}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-70">Authenticated Customer</p>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md ring-1 ring-slate-100">
                        <MapPin className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] mb-1">Destination</p>
                        {order.shippingAddress ? (
                          <div className="text-sm text-slate-700 font-bold leading-snug">
                            {order.shippingAddress.address}<br />
                            <span className="text-slate-400">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</span>
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm font-bold italic">No address specified</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md ring-1 ring-slate-100">
                        <Phone className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] mb-1">Contact</p>
                        <p className="text-base font-black text-slate-900 tracking-tight">{order.shippingAddress?.phone || order.guestPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Origin Card */}
              <Card className="border border-slate-100 shadow-xl shadow-slate-200/30 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50 pb-4">
                  <CardTitle className="text-base font-black flex items-center gap-3 text-slate-900 uppercase tracking-tight">
                    <Warehouse className="h-5 w-5 text-amber-500" />
                    Dispatch Node
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100/50">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 truncate text-base tracking-tight">{(order.delivery?.pickupWarehouse as { label?: string })?.label || 'STOND CENTRAL HUB'}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Verified Operational Node</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                        <MapPin className="h-5 w-5 text-slate-300" />
                      </div>
                      <div>
                        <p className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] mb-1">Dispatch Base</p>
                        <p className="text-sm font-black text-slate-600 leading-tight">
                          {(order.delivery?.pickupWarehouse as { address?: string })?.address || "Tech Grid Station - 41"}<br />
                          <span className="text-slate-400">{(order.delivery?.pickupWarehouse as { city?: string })?.city || "Bangalore"}, IND</span>
                        </p>
                      </div>
                    </div>
                    
                    {order.delivery?.provider && (
                      <div className="pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-4 text-sm font-black text-slate-900 bg-slate-900 px-4 py-3 rounded-2xl">
                            <Truck className="h-6 w-6 text-amber-500 shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Carrier</span>
                              <span className="text-white text-sm font-black tracking-tight">{order.delivery.provider}</span>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Journey Timeline */}
            {order.delivery?.trackingId && (
              <Card className="border border-slate-50 bg-white/50 backdrop-blur-sm rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Tracking Stream</h3>
                </div>
                <ShipmentTracking orderId={order.id} trackingId={order.delivery.trackingId} />
              </Card>
            )}
          </div>
        </div>

        {/* Console Sidebar: Financial Ledger */}
        <div className="lg:col-span-4 space-y-8 sticky top-8">
          {/* Main Ledger */}
          <Card className="border-none shadow-2xl shadow-slate-900/40 bg-slate-900 rounded-3xl overflow-hidden text-white group">
            <CardHeader className="p-8 border-b border-white/5 bg-white/5">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">Node Finalization</p>
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Receipt className="h-6 w-6 text-emerald-400" />
                Financial Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                {[
                  { label: "Gross Subtotal", val: order.subtotal },
                  { label: "Delivery Charge", val: order.shippingCost },
                  { label: "System Tax (GST)", val: order.gst || order.tax || 0 },
                  { label: "Infrastructure Fee", val: order.platformFee || 0 }
                ].map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center group/row">
                    <span className="font-bold text-slate-500 uppercase tracking-[0.15em] text-[9px] group-hover/row:text-slate-300 transition-colors">{row.label}</span>
                    <span className="font-black text-slate-100 tracking-tight text-base">₹{row.val?.toLocaleString() || '0.00'}</span>
                  </div>
                ))}
                
                {order.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 bg-emerald-400/5 p-4 rounded-xl border border-emerald-400/10">
                    <div className="flex flex-col">
                      <span className="font-bold uppercase tracking-[0.1em] text-[9px] opacity-70">
                        System Credit
                      </span>
                      {order.discountCode && (
                        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">{order.discountCode}</span>
                      )}
                    </div>
                    <span className="font-black tracking-tight text-lg">-₹{order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="pt-8 border-t border-white/10 flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Final Node Yield</span>
                  <span className="text-5xl font-black text-emerald-400 tracking-tighter">₹{order.total?.toLocaleString() || '0.00'}</span>
                </div>
            </CardContent>
          </Card>

          {/* Infrastructure Metadata */}
          <Card className="border border-slate-100 shadow-xl shadow-slate-200/30 bg-white rounded-3xl overflow-hidden group">
            <CardHeader className="p-6 border-b border-slate-50 pb-4">
              <CardTitle className="text-[10px] font-black flex items-center gap-3 text-slate-400 uppercase tracking-[0.2em]">
                <Command className="h-5 w-5" />
                Network Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none block pl-1">Object ID</label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/code">
                  <code className="text-[9px] font-mono text-slate-500 truncate mr-4 font-black">{order.id}</code>
                  <Hash className="h-4 w-4 text-slate-300 group-hover/code:text-amber-500 transition-colors shrink-0" />
                </div>
              </div>
              {order.checkoutId && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none block pl-1">Payment Key</label>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/code">
                    <code className="text-[9px] font-mono text-slate-500 truncate mr-4 font-black">{order.checkoutId}</code>
                    <Zap className="h-4 w-4 text-slate-300 group-hover/code:text-indigo-500 transition-colors shrink-0" />
                  </div>
                </div>
              )}
              <div className="pt-8 flex flex-col items-center justify-center border-t border-slate-50 space-y-2">
                 <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.1em]">NODE_SYNC_ACTIVE</span>
                 </div>
                 <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.3em]">STOND_OS v3.1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
