"use client";

import { ArrowLeft } from "lucide-react";

export function GoBackButton() {
  return (
    <button 
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-amber-600 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Go Back
    </button>
  );
}
