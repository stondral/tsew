"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintLabelButtonProps {
  trackingId: string;
}

export default function PrintLabelButton({ trackingId }: PrintLabelButtonProps) {
  const handlePrint = () => {
    window.open(`/api/delhivery/label?waybill=${trackingId}`, "_blank");
  };

  return (
    <Button
      variant="outline"
      className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95"
      onClick={handlePrint}
    >
      <Printer className="h-4 w-4 text-emerald-500" />
      Print Label
    </Button>
  );
}
