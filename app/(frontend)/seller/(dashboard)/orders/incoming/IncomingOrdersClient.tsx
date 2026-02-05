"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Truck, Check, X, AlertCircle, Sparkles, PartyPopper, MapPin, Loader2 } from "lucide-react"
import { acceptOrderAction } from "@/app/(frontend)/seller/actions/orders"
import { motion, AnimatePresence } from "framer-motion"
import { resolveMediaUrl } from "@/lib/media"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

const PROVIDERS = [
  { name: "Delhivery", cost: 60 },
  { name: "XpressBees", cost: 55 },
  { name: "BlueDart", cost: 80 },
]

interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  priceAtPurchase: number;
  status?: string;
}

interface Order {
  id: string;
  orderNumber?: string;
  createdAt: string;
  status: string;
  items: OrderItem[];
  subtotal?: number;
  gst?: number;
  total?: number;
}

interface Warehouse {
  id: string;
  label: string;
  city: string;
  state: string;
  address?: string;
}

export default function IncomingOrdersClient({ orders, warehouses }: { orders: Order[], warehouses: Warehouse[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Package className="h-10 w-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No incoming orders</h2>
        <p className="text-slate-500 mt-2 text-center max-w-xs">
          New orders will appear here as soon as customers place them. Stay tuned!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Incoming Orders</h1>
          <p className="text-slate-500 text-sm">Review and accept new customer orders</p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-4 py-1 rounded-full font-bold">
          {orders.length} PENDING
        </Badge>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <OrderCard order={order} warehouses={warehouses} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function OrderCard({ order, warehouses }: { order: Order, warehouses: Warehouse[] }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)

  if (isAccepted) {
    return (
      <Card className="overflow-hidden border-emerald-100 bg-emerald-50/30 p-12 text-center relative overflow-hidden">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Check className="h-8 w-8 stroke-[4]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-900 tracking-tight">Order Accepted!</h3>
            <p className="text-emerald-600 font-bold text-sm">Moving to processing...</p>
          </div>
        </motion.div>
        {/* Sparkles background effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
           {[...Array(6)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute"
               initial={{ 
                 x: "50%", 
                 y: "50%", 
                 scale: 0 
               }}
               animate={{ 
                 x: `${Math.random() * 100}%`, 
                 y: `${Math.random() * 100}%`, 
                 scale: [0, 1, 0],
                 rotate: 360
               }}
               transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
             >
               <Sparkles className="text-emerald-400 h-4 w-4" />
             </motion.div>
           ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}</span>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px] uppercase tracking-wider">
                {order.status}
              </Badge>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-0.5">
              {new Date(order.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </p>
          </div>

          <Button 
            onClick={() => setIsAccepting(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-8 shadow-lg shadow-amber-500/20 transition-all active:scale-95 group-hover:scale-105"
          >
            Accept Order
          </Button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Order Items</h4>
          <div className="space-y-3">
            {order.items.map((item, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                   {item.productImage ? (
                     <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 relative">
                       <Image 
                         src={resolveMediaUrl(item.productImage)} 
                         alt={item.productName} 
                         fill
                         className="object-cover" 
                       />
                     </div>
                   ) : (
                     <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                       <Package className="h-5 w-5 text-slate-300" />
                     </div>
                   )}
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{item.productName}</span>
                      <span className="text-xs text-slate-400 font-medium">Qty: {item.quantity}</span>
                   </div>
                </div>
                <span className="font-black text-slate-900">₹{(item.priceAtPurchase * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50 flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-500">
             <span>Subtotal</span>
             <span>₹{order.subtotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold text-slate-500">
             <span>GST</span>
             <span>₹{order.gst?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-black text-slate-900 mt-2">
             <span>Grand Total</span>
             <span className="text-amber-500 font-black">₹{order.total?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAccepting && (
          <DeliveryModal 
            order={order} 
            warehouses={warehouses}
            onClose={() => setIsAccepting(false)} 
            onSuccess={() => setIsAccepted(true)}
          />
        )}
      </AnimatePresence>
    </Card>
  )
}

function DeliveryModal({ order, warehouses, onClose, onSuccess }: { order: Order, warehouses: Warehouse[], onClose: () => void, onSuccess: () => void }) {
  const router = useRouter()
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<null | { name: string; cost: number }>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!selectedProvider || !selectedWarehouse) return
    setError(null)
    
    startTransition(() => {
       (async () => {
          const gst = selectedProvider.cost * 0.18
          const result = await acceptOrderAction(order.id, {
            provider: selectedProvider.name,
            cost: selectedProvider.cost,
            gst: gst,
            pickupWarehouse: selectedWarehouse.id
          })

          if (result.ok) {
            onSuccess()
            setTimeout(() => {
              router.refresh()
            }, 4000)
          } else {
            setError(result.error || "Failed to accept order")
          }
       })()
    })
  }



  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-white"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Truck className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Schedule Delivery</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Warehouse Selection Step */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Step 1: Select Pickup Warehouse
              </label>
              {warehouses.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-hide">
                  {warehouses.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWarehouse(w)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                        selectedWarehouse?.id === w.id
                          ? "border-amber-500 bg-amber-50/30 shadow-sm"
                          : "border-slate-50 hover:border-amber-200 bg-white"
                      )}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-slate-900 text-sm truncate">{w.label}</span>
                        <span className="text-[10px] text-slate-400 font-bold truncate">
                          {w.city}, {w.state}
                        </span>
                      </div>
                      {selectedWarehouse?.id === w.id && <Check className="h-4 w-4 text-amber-500 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold flex flex-col items-center gap-2 text-center">
                   <AlertCircle className="h-5 w-5" />
                   <span>No warehouses found. Please add a warehouse first.</span>
                   <Link href="/seller/warehouses" className="underline">Go to Warehouses</Link>
                </div>
              )}
            </div>

            {/* Provider Selection Step */}
            <AnimatePresence>
              {selectedWarehouse && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="space-y-4 overflow-hidden"
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <Truck className="h-3 w-3" /> Step 2: Select Delivery Partner
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => setSelectedProvider(p)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                          selectedProvider?.name === p.name
                            ? "border-amber-500 bg-amber-50/50 shadow-md"
                            : "border-slate-50 hover:border-amber-200 bg-white shadow-sm"
                        )}
                      >
                        <span className={cn(
                          "font-bold text-xs",
                          selectedProvider?.name === p.name ? "text-slate-900" : "text-slate-600"
                        )}>{p.name}</span>
                        <span className="font-black text-slate-900 text-xs">₹{p.cost}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedProvider && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2 overflow-hidden"
              >
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  <span>Shipping Cost</span>
                  <span>₹{selectedProvider.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  <span>GST (18%)</span>
                  <span>₹{(selectedProvider.cost * 0.18).toFixed(2)}</span>
                </div>
                <Separator className="my-2 bg-slate-200" />
                <div className="flex justify-between text-lg font-black text-slate-900">
                  <span className="uppercase tracking-tighter">Total Fee</span>
                  <span className="text-amber-500">₹{(selectedProvider.cost * 1.18).toFixed(2)}</span>
                </div>
              </motion.div>
            )}
          </div>

          {error && (
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 italic"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-8">
            <Button variant="ghost" onClick={onClose} className="font-bold text-slate-500 rounded-2xl h-14">
              Cancel
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={!selectedProvider || !selectedWarehouse || isPending}
              className="bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-14 shadow-xl active:scale-95 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  Confirm <PartyPopper className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
