"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper, LayoutDashboard, Package } from "lucide-react";

interface SubmissionSuccessModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  onGoToDashboard: () => void;
  onViewProducts: () => void;
}

export function SubmissionSuccessModal({
  isOpen,
  mode,
  onGoToDashboard,
  onViewProducts,
}: SubmissionSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-8 pt-10 pb-12 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-4 left-4 h-16 w-16 bg-white/10 rounded-full" />
              <div className="absolute bottom-2 right-8 h-10 w-10 bg-white/10 rounded-full" />
              <div className="absolute top-8 right-4 h-6 w-6 bg-white/10 rounded-full" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="inline-flex items-center justify-center h-20 w-20 bg-white/20 rounded-[1.5rem] mb-5 backdrop-blur-sm"
              >
                {mode === "create" ? (
                  <PartyPopper className="h-10 w-10 text-white" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-white" />
                )}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-white tracking-tight"
              >
                {mode === "create"
                  ? "🎉 Thank You for Your Submission!"
                  : "✅ Changes Submitted Successfully"}
              </motion.h2>
            </div>

            {/* Body */}
            <div className="px-8 py-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {mode === "create" ? (
                  <div className="space-y-4 text-center">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      We appreciate your trust in{" "}
                      <span className="font-bold text-amber-600">Stond Emporium</span>.
                    </p>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Your product is now under review. Our team will verify it and push it
                      to your storefront shortly.
                    </p>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-4">
                      <p className="text-amber-700 text-xs font-bold">
                        📩 You&apos;ll receive an email confirmation once it&apos;s approved.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Your product updates have been saved successfully.
                    </p>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      The existing version remains live until approval. You&apos;ll be
                      notified once the updated version is published.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-4">
                      <p className="text-emerald-700 text-xs font-bold">
                        ✨ Your customers won&apos;t see any disruption during the review.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-3 mt-8"
              >
                <Button
                  onClick={onViewProducts}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider gap-3 shadow-xl shadow-amber-500/20"
                >
                  <Package className="h-5 w-5" />
                  View Product Status
                </Button>
                <Button
                  onClick={onGoToDashboard}
                  variant="outline"
                  className="w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold text-sm gap-3"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
