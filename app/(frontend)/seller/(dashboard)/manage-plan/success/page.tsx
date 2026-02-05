"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
// import confetti from "canvas-confetti"; // Requires installation, I'll stick to CSS/Motion for now or skip if not available

export default function SubscriptionSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // confetti logic could go here if library was present
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="h-2 bg-green-500" />
        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome to the Premium Club! 🎉</h1>
          <p className="text-slate-500 mb-8">Your subscription has been successfully activated. Get ready to scale your business with advanced tools and priority support.</p>

          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3 border border-slate-100">
             <div className="flex justify-between text-sm">
                 <span className="text-slate-400 font-medium">Status</span>
                 <span className="text-green-600 font-bold uppercase tracking-wider text-xs">Active</span>
             </div>
             <div className="flex justify-between text-sm">
                 <span className="text-slate-400 font-medium">AutoPay</span>
                 <span className="text-slate-900 font-bold">Enabled</span>
             </div>
          </div>

          <Link href="/seller/dashboard">
            <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg group">
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
