"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  User, 
  Mail, 
  Clock,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  Share2,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderMasterCard } from "./OrderMasterCard";

interface ShippingAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface Delivery {
  provider?: string;
  trackingId?: string;
  cost?: number;
  gst?: number;
  pickupWarehouse?: string | {
    id: string;
    label?: string;
  };
}

interface Order {
  id: string;
  total?: number;
  paymentStatus?: string;
  shippingAddress?: ShippingAddress;
  delivery?: Delivery;
}

interface ContextPanelProps {
  customer: { id: string; username?: string; email?: string };
  orderHistory?: Order[];
  isFetchingHistory?: boolean;
  isReadOnly?: boolean;
}

export function ContextPanel({ customer, orderHistory = [], isFetchingHistory, isReadOnly }: ContextPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer?.id) return;
      try {
        const token = localStorage.getItem("payload-token");
        const response = await fetch(
          `/api/admin/customer-orders?customerId=${customer.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setOrders(data.docs || []);
        }
      } catch (err) {
        console.error("Failed to fetch customer context:", err);
      }
    };

    fetchOrders();
  }, [customer?.id]);

  const ltv = useMemo(() => orders.reduce((sum, ord) => sum + (ord.total || 0), 0), [orders]);
  const refundCount = useMemo(() => orders.filter(ord => ord.paymentStatus === 'refunded').length, [orders]);
  const isHighRisk = refundCount > 2;

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto custom-scrollbar p-10 space-y-12 pb-24">
      {/* 1. Customer Snapshot - Elevated Header */}
      <section className="p-8 bg-white dark:bg-[#111b21] rounded-[2.5rem] shadow-xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/5 border-t-8 border-emerald-500">
        <div className="flex items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shadow-inner ring-4 ring-white dark:ring-[#202c33]">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-[18px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {customer?.username || 'Guest_User'}
            </h3>
            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mt-1 italic">
                Authorized_Client
            </p>
          </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl ring-1 ring-emerald-500/10">
                <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[160px]">{customer?.email}</span>
                </div>
                <ExternalLink className="h-3 w-3 text-emerald-300" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-[#202c33] rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5 border-l-4 border-emerald-400">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Order_Log</p>
                    <p className="text-[20px] font-black text-slate-900 dark:text-white italic">{orders.length}</p>
                </div>
                <div className="p-5 bg-white dark:bg-[#202c33] rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5 border-l-4 border-emerald-500">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2">Lifetime Thr</p>
                    <p className="text-[20px] font-black text-emerald-600 dark:text-emerald-400 italic">₹{ltv.toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>

        {isHighRisk && (
          <div className="mt-6 p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl ring-1 ring-rose-500/10 flex items-center gap-4 group">
            <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">High Refund Frequency</p>
                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest leading-none mt-1">Status_At_Risk</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. Master Ledger Deep View - The Dual-Pane Dashboard */}
      <div className="space-y-10">
          <div className="flex items-center justify-between px-2">
              <h2 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Order_Ledger_Dashboard</h2>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-emerald-600 border-emerald-500/20 bg-emerald-50">
                  {orderHistory.length} Nodes_Active
              </Badge>
          </div>

          <div className="space-y-8">
              {orderHistory.length > 0 ? (
                  orderHistory.map((ord) => (
                      <div key={ord.id} className="relative group">
                          <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-slate-100 dark:bg-white/5 group-hover:bg-emerald-500/30 transition-colors" />
                          <OrderMasterCard 
                              order={ord} 
                              onUpdate={() => {
                                  // Sync logic
                              }}
                              isReadOnly={isReadOnly}
                          />
                      </div>
                  ))
              ) : isFetchingHistory ? (
                <div className="p-12 bg-white dark:bg-[#111b21] rounded-[2.5rem] border-2 border-dashed border-emerald-500/10 flex flex-col items-center justify-center opacity-40">
                    <Clock className="h-8 w-8 text-emerald-500 mb-4 animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Synchronizing_History...</span>
                </div>
              ) : (
                <div className="p-12 bg-white dark:bg-[#111b21] rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center opacity-30">
                    <Zap className="h-8 w-8 text-slate-400 mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Zero_Transactional_Nodes</span>
                </div>
              )}
          </div>
      </div>

      {/* 3. Quick Control Override - Anchored Actions */}
      <section className={cn(
        "p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 border-t-8 transition-all duration-700",
        isReadOnly ? "bg-slate-100 dark:bg-[#0b141a] border-slate-200 dark:border-white/5 opacity-80" : "bg-slate-900 border-slate-700"
      )}>
        <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Override_Procedures</h4>
            {isReadOnly && (
                <Badge variant="outline" className="text-[8px] border-slate-200 text-slate-400 font-black uppercase">Archive_Locked</Badge>
            )}
        </div>
        <div className="grid grid-cols-2 gap-4">
            <Button 
                variant="ghost" 
                disabled={isReadOnly}
                className={cn(
                    "flex flex-col items-center justify-center h-24 rounded-3xl bg-white/5 font-black text-[10px] uppercase tracking-widest gap-3 transition-all",
                    isReadOnly ? "text-slate-400/50 cursor-not-allowed" : "hover:bg-emerald-500 text-white hover:-translate-y-1"
                )}
            >
                <CreditCard className="h-5 w-5" />
                Refund
            </Button>
            <Button 
                variant="ghost" 
                disabled={isReadOnly}
                className={cn(
                    "flex flex-col items-center justify-center h-24 rounded-3xl bg-white/5 font-black text-[10px] uppercase tracking-widest gap-3 transition-all",
                    isReadOnly ? "text-slate-400/50 cursor-not-allowed" : "hover:bg-emerald-500 text-white hover:-translate-y-1"
                )}
            >
                <Share2 className="h-5 w-5" />
                Tracking
            </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Encryption_Active • Secure_Node</p>
        </div>
      </section>
    </div>
  );
}
