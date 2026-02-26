import React from 'react';
import Image from 'next/image';
import logoston from '@/components/logoston.png';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center bg-white min-h-[60vh] py-20">
      <div className="flex flex-col items-center gap-6">
        {/* Premium Pulse Logo */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-2xl animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          
          <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <Image 
              src={logoston} 
              alt="Stond Emporium" 
              width={56} 
              height={56}
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
          Crafting Excellence
        </p>
      </div>
    </div>
  );
}
