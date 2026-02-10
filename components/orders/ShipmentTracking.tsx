"use client";

import { useEffect, useState } from "react";
import { getLiveTracking } from "@/app/(frontend)/orders/actions/tracking";
import { Loader2, Truck, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ScanHistory {
  ScanDetail: {
    Status: string;
    ScannedLocation: string;
    Instructions: string;
    ScanDateTime: string;
    Scan: string;
  };
}

interface Props {
  orderId: string;
  trackingId: string;
}

export function ShipmentTracking({ orderId, trackingId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ status: string, history: ScanHistory[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracking() {
      try {
        const res = await getLiveTracking(orderId, trackingId);
        if (res.ok && res.data) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load tracking info.");
        }
      } catch {
        setError("Error fetching tracking data.");
      } finally {
        setLoading(false);
      }
    }

    if (trackingId) {
      fetchTracking();
    } else {
      setLoading(false);
      setError("No tracking ID provided.");
    }
  }, [orderId, trackingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-500">Syncing with Delhivery Pulse...</p>
      </div>
    );
  }

  if (error || !data || !data.history || data.history.length === 0) {
    return (
      <div className="p-6 bg-orange-50 dark:bg-orange-950/20 rounded-3xl border border-orange-100 dark:border-orange-900/30 text-center">
        <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{error || "No tracking records found yet."}</p>
        <p className="text-gray-400 text-xs">We&apos;re not seeing any tracking updates yet. This could mean the shipment is &quot;In-Transit&quot; or the carrier hasn&apos;t started tracking.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm md:text-base">Live Journey</h3>
            <p className="text-[10px] md:text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">{data.status}</p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Waybill</p>
           <p className="font-mono text-[10px] md:text-sm font-bold text-gray-700 dark:text-gray-300">{trackingId}</p>
        </div>
      </div>

      <div className="space-y-8 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800 pr-2">
        {data.history.map((scan, idx) => {
          const detail = scan.ScanDetail;
          const isLatest = idx === 0;
          
          return (
            <div key={idx} className="relative pl-14 group">
              <div className={cn(
                "absolute left-0 top-1 h-9 w-9 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                isLatest ? "bg-amber-500 text-white shadow-xl shadow-amber-200 dark:shadow-none" : "bg-slate-50 dark:bg-slate-800 text-slate-300"
              )}>
                {isLatest ? <Clock className="h-4 w-4" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
              </div>
              
              <div className="space-y-1.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                  <h4 className={cn("font-black text-sm md:text-sm uppercase tracking-tight", isLatest ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-400")}>
                    {detail.Status}
                  </h4>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">
                    {detail.ScanDateTime ? format(new Date(detail.ScanDateTime), "MMM dd, HH:mm") : "---"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                  <MapPin className="h-3 w-3 text-amber-500/50" />
                  <span className="truncate">{detail.ScannedLocation}</span>
                </div>
                {detail.Instructions && (
                  <p className="text-[10px] text-slate-400 italic mt-1.5 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-dashed border-slate-100 italic">&quot;{detail.Instructions}&quot;</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
