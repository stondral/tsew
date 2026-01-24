"use client";

import { motion } from "motion/react";
import { XCircle, RefreshCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SubscriptionFailedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="h-2 bg-red-500" />
        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-12 h-12 text-red-600" />
          </motion.div>

          <h1 className="text-3xl font-black text-slate-900 mb-2">Oops! Payment Failed</h1>
          <p className="text-slate-500 mb-8">We couldn&apos;t process your subscription. This could be due to insufficient funds, an expired card, or a temporary bank issue.</p>

          <div className="space-y-4">
            <Link href="/seller/manage-plan">
                <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg group">
                <RefreshCcw className="mr-2 w-5 h-5" />
                Try Again
                </Button>
            </Link>
            
            <a href="mailto:support@stondemporium.tech">
                <Button variant="outline" className="w-full h-14 border-slate-200 text-slate-600 rounded-2xl font-bold">
                <MessageCircle className="mr-2 w-5 h-5" />
                Contact Support
                </Button>
            </a>
          </div>

          <p className="mt-8 text-xs text-slate-400 font-medium italic">
              Don&apos;t worry, no charges were made if the transaction failed.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
