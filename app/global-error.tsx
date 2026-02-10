'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { AlertTriangle, RefreshCcw, Home, MessageSquare } from 'lucide-react';
import logoston from '@/components/logoston.png';
import '@/app/globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-white min-h-screen flex items-center justify-center font-sans selection:bg-orange-500/30">
        <div className="max-w-2xl w-full px-6 py-12 text-center animate-in fade-in zoom-in duration-700">
          {/* Logo / Badging */}
          <div className="mb-12 flex flex-col items-center">
             <div className="relative w-24 h-24 mb-6 group">
                <div className="absolute inset-0 bg-orange-500 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-2xl p-1 shadow-2xl ring-1 ring-white/10 flex items-center justify-center overflow-hidden">
                   <Image 
                     src={logoston} 
                     alt="STOND Logo" 
                     className="w-20 h-20 rounded-xl object-contain shadow-inner"
                     priority
                   />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-zinc-950 border border-white/10 rounded-full p-1.5 shadow-xl">
                   <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                </div>
             </div>
             <h1 className="text-4xl font-black tracking-tighter mb-2">
                STOND<span className="text-orange-500">.</span>
             </h1>
             <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-orange-500 to-transparent mb-8"></div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">System Interruption Detected</h2>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed max-w-sm mx-auto">
              That&apos;s an unexpected turn of events. Please try refreshing or returning to the gallery home.
            </p>

            {/* Technical Detail Card */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 mt-10 text-left group transition-all hover:bg-zinc-900/60">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Internal Trace ID</span>
                    <span className="text-[10px] font-mono text-orange-500/70 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">
                        {error.digest || 'ST-ERR-SYSTEM'}
                    </span>
                </div>
                <p className="text-xs font-mono text-zinc-500 line-clamp-2 group-hover:line-clamp-none transition-all duration-500 ease-in-out leading-relaxed">
                    {error.message || "No additional error info provided."}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
              <button
                onClick={() => reset()}
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/5"
              >
                <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                Initialize System Reset
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-bold rounded-xl border border-white/5 hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Base
              </button>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest gap-4">
             <p className="font-medium">© 2026 STOND EMPORIUM • Engineered for excellence</p>
             <div className="flex items-center gap-6">
                <a href="/support" className="hover:text-zinc-400 flex items-center gap-1.5 transition-colors">
                    <MessageSquare className="w-3 h-3" /> Support Console
                </a>
             </div>
          </div>
        </div>
      </body>
    </html>
  );
}
