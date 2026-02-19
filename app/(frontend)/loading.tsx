import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Premium Pulse Logo Placeholder */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse" />
          <div className="relative flex items-center justify-center w-full h-full rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-orange-600 font-black text-xl italic tracking-tighter">S</span>
          </div>
        </div>
        
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
          Crafting Excellence
        </p>
      </div>
    </div>
  );
}
