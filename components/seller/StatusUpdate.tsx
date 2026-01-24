"use client";

import { useState } from "react";
import { updateItemStatus } from "@/app/(frontend)/seller/orders/actions/updateItemStatus";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StatusUpdateProps {
  orderId: string;
  itemIdx: number;
  currentStatus: string;
}

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export function StatusUpdate({ orderId, itemIdx, currentStatus }: StatusUpdateProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const res = await updateItemStatus(orderId, itemIdx, newStatus);
      if (res.ok) {
        setStatus(newStatus);
        toast.success("Status updated successfully");
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[140px] h-9 text-xs font-black uppercase tracking-widest bg-white border-slate-200 rounded-xl">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
          {statusOptions.map((opt) => (
            <SelectItem 
              key={opt.value} 
              value={opt.value}
              className="text-xs font-bold uppercase tracking-widest py-3"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
