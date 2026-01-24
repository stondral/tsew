"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Check, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  Rocket, 
  TrendingUp, 
  HelpCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthContext";
import { createSubscriptionAction, verifySubscriptionAction, cancelSubscriptionAction } from "./actions";
import { useRouter } from "next/navigation";

type BillingCycle = "monthly" | "yearly"; // Simplified cycles for now

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: {
      monthly: 499,
      yearly: 4990, // 2 months free
    },
    description: "Perfect for onboarding and small-scale testing.",
    icon: ShieldCheck,
    color: "slate",
    roi: "Remove friction, start selling today",
    perks: [
      { text: "Up to 5 products", included: true },
      { text: "Up to 50 orders", included: true },
      { text: "WhatsApp order alerts", included: true },
      { text: "Manual fulfillment", included: true },
      { text: "Community support", included: true },
      { text: "Automated order flow", included: false },
      { text: "Priority search listing", included: false },
    ],
    cta: "Basic Plan",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: {
      monthly: 1999,
      yearly: 19990, // 2 months free
    },
    description: "Designed to make sellers more money with automation.",
    icon: Rocket,
    color: "amber",
    roi: "Most sellers recover this fee in 1–2 orders",
    perks: [
      { text: "Unlimited products", included: true },
      { text: "Automated order flow", included: true },
      { text: "Priority search listing", included: true },
      { text: "₹2,000 promo credits", included: true },
      { text: "Weekly sales insights", included: true },
      { text: "Faster payouts", included: true },
      { text: "Homepage spotlight", included: false },
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: {
      monthly: 4999,
      yearly: 49990, // 2 months free
    },
    description: "Built for power sellers and established brands.",
    icon: Zap,
    roi: "Built for serious high-volume business",
    color: "indigo",
    perks: [
      { text: "Everything in Pro", included: true },
      { text: "Homepage spotlight", included: true },
      { text: "Custom storefront branding", included: true },
      { text: "Dedicated account support", included: true },
      { text: "Early access to features", included: true },
      { text: "Negotiated shipping rates", included: true },
      { text: "White-glove onboarding", included: true },
    ],
    cta: "Go Elite",
    popular: false,
  },
];

export default function ManagePlanPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const currentPlan = user?.plan || "starter";
  const isActive = user?.subscriptionStatus === "active";

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (plan.id === currentPlan && isActive) return;
    
    setLoadingPlan(plan.id);
    try {
      const res = await createSubscriptionAction(plan.id, billingCycle);
      
      if (!res.ok) {
        alert(res.error || "Failed to initiate subscription");
        return;
      }

      const options = {
        key: res.keyId,
        subscription_id: res.subscriptionId,
        name: "Stond Emporium",
        description: `${plan.name} Subscription (${billingCycle})`,
        image: "https://res.cloudinary.com/ddyp4krsd/image/upload/v1769238624/logoston_rsgzgk.jpg",
        handler: async function (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) {
             const verifyRes = await verifySubscriptionAction({
                 ...response,
                 planName: plan.id as "starter" | "pro" | "elite"
             });
             if (verifyRes.ok) {
                 await refresh();
                 router.push("/seller/manage-plan/success");
             } else {
                 router.push("/seller/manage-plan/failed");
             }
        },
        prefill: {
          name: res.customerDetails?.name || "",
          email: res.customerDetails?.email || "",
          contact: res.customerDetails?.contact || "",
        },
        theme: {
          color: "#f59e0b",
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
       console.error("Upgrade error:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to stop your subscription? This will deactivate your premium features at the end of the billing period.")) return;
    
    setIsCancelling(true);
    try {
      const cancelRes = await cancelSubscriptionAction();
      
      if (cancelRes.ok) {
          await refresh();
          alert("Subscription cancelled successfully.");
      } else {
          alert(cancelRes.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Cancel error:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Current Plan Overview (Creative Dashboard) */}
      {isActive && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
        >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none rounded-3xl overflow-hidden shadow-2xl">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                {currentPlan === "starter" ? <ShieldCheck className="h-10 w-10" /> : 
                                 currentPlan === "pro" ? <Rocket className="h-10 w-10" /> : 
                                 <Zap className="h-10 w-10" />}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">Your Current Plan: {currentPlan}</h2>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                        <Badge className="bg-green-500/10 text-green-500 border-none flex items-center gap-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                            ACTIVE
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                        <Calendar className="h-4 w-4" />
                                        <span>Next Billing: {user?.nextBillingDate && new Date(user.nextBillingDate).getFullYear() > 1970 ? new Date(user.nextBillingDate).toLocaleDateString('en-IN') : 'Processing...'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                        <CreditCard className="h-4 w-4" />
                                        <span>AutoPay: ON</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Badge variant="outline" className="text-slate-400 border-slate-700 py-2 px-4 rounded-xl font-bold uppercase">
                                <Clock className="h-4 w-4 mr-2" />
                                Recurrs {user?.billingCycle || 'Monthly'}
                            </Badge>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/10 font-bold text-xs uppercase"
                            >
                                {isCancelling ? "Stopping..." : "Stop Subscription"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-4 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold border-none">
            BILLING & SUBSCRIPTION
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            {isActive ? "Thinking of an" : "Choose a plan that"} <span className="text-amber-500">{isActive ? "Upgrade?" : "grows with you"}</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            {isActive 
                ? "Unlock even more power and reach by switching to a higher tier." 
                : "Scale your business with ROI-focused plans designed for every stage of your journey."}
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner relative">
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  "relative px-8 py-2.5 text-sm font-bold transition-all rounded-xl",
                  billingCycle === cycle 
                    ? "bg-white text-slate-900 shadow-md" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-green-600 animate-pulse">
            <TrendingUp className="h-4 w-4" />
            <span>Save up to 17% with Yearly billing</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch mb-20">
        {plans.map((plan, idx) => {
          const isCurrent = plan.id === currentPlan && isActive;
          const isDowngrade = (plan.id === "starter" && (currentPlan === "pro" || currentPlan === "elite")) || 
                             (plan.id === "pro" && currentPlan === "elite");
          
          return (
            <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="h-full"
            >
                <Card className={cn(
                "relative h-full border-none transition-all duration-300 group overflow-hidden",
                plan.popular 
                    ? "bg-white shadow-[0_20px_50px_rgba(245,158,11,0.15)] ring-2 ring-amber-500/20 scale-105 z-10" 
                    : "bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50",
                isCurrent && "ring-2 ring-slate-900/10 opacity-75 grayscale-[0.5]"
                )}>
                {plan.popular && (
                    <div className="absolute top-0 right-0">
                    <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-2 rotate-45 translate-x-12 -translate-y-2 shadow-lg">
                        Recommended
                    </div>
                    </div>
                )}

                <CardContent className="p-8 flex flex-col h-full">
                    <div className="mb-8">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
                        plan.id === "starter" && "bg-slate-100 text-slate-600 shadow-slate-200",
                        plan.id === "pro" && "bg-amber-500 text-white shadow-amber-200",
                        plan.id === "elite" && "bg-indigo-600 text-white shadow-indigo-200"
                    )}>
                        <plan.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-sm font-semibold text-slate-700 flex items-center gap-3">
                    <span className="text-amber-500 tracking-wider">ROI:</span>
                    {plan.roi}
                    </div>

                    <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">₹{plan.price[billingCycle].toLocaleString()}</span>
                        <span className="text-slate-400 font-bold">/</span>
                        <span className="text-slate-400 font-bold text-sm">
                        {billingCycle === "monthly" ? "month" : "year"}
                        </span>
                    </div>
                    {billingCycle !== "monthly" && (
                        <div className="text-green-600 text-xs font-bold mt-2">
                        Effective ₹{Math.round(plan.price[billingCycle] / 12).toLocaleString()} / mo
                        </div>
                    )}
                    </div>

                    <div className="space-y-4 mb-10 flex-1">
                    {plan.perks.map((perk, i) => (
                        <div key={i} className={cn("flex items-start gap-3 text-sm transition-opacity", !perk.included && "opacity-40")}>
                        <div className={cn(
                            "mt-1 shrink-0 h-4 w-4 rounded-full flex items-center justify-center",
                            perk.included ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                        )}>
                            {perk.included ? <Check className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </div>
                        <span className={cn("font-semibold leading-tight", perk.included ? "text-slate-700" : "text-slate-400")}>
                            {perk.text}
                        </span>
                        </div>
                    ))}
                    </div>

                    <Button 
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrent || isDowngrade || loadingPlan !== null}
                    className={cn(
                        "w-full h-12 rounded-xl font-black text-sm tracking-wide transition-all duration-300 shadow-lg relative overflow-hidden",
                        isCurrent 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                            : plan.popular
                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 active:scale-95"
                                : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200 active:scale-95",
                        isDowngrade && "bg-slate-50 text-slate-300"
                    )}
                    >
                        {loadingPlan === plan.id ? (
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <RefreshCcw className="h-5 w-5" />
                            </motion.div>
                        ) : isCurrent ? "Current Plan" : isDowngrade ? "Downgrade Restricted" : plan.cta}
                    </Button>
                </CardContent>
                </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Trust & Insights */}
      <div className="mt-20 py-12 border-t border-slate-100">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
              Business <span className="text-amber-500">Insights</span> that matter
            </h2>
            <div className="space-y-6">
              {[
                { title: "Top Selling Opportunity", desc: "You could earn ₹12,000 extra by listing 5 more items in Electronics.", icon: TrendingUp },
                { title: "Demand Alert", desc: "Sustainable home decor is trending in 3 cities near you.", icon: AlertCircle }
              ].map((insight, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 shrink-0 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <insight.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{insight.title}</h4>
                    <p className="text-sm text-slate-500 font-medium">{insight.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-400 italic">
               <HelpCircle className="h-4 w-4" />
               Upgrade for deeper, data-driven insights.
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/10 to-indigo-500/10 rounded-3xl blur-2xl" />
             <Card className="relative bg-white border-0 shadow-2xl rounded-3xl overflow-hidden px-8 py-10">
                <CardContent className="p-0">
                   <div className="flex gap-4 mb-6">
                      <div className="flex -space-x-4">
                         {[1,2,3,4].map(i => (
                            <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center overflow-hidden relative">
                               <Image src={`https://i.pravatar.cc/150?u=${i}`} alt="user" fill className="object-cover" />
                            </div>
                         ))}
                      </div>
                      <div className="flex flex-col justify-center">
                         <div className="flex text-amber-500 h-4 mb-1">
                            {[1,2,3,4,5].map(i => <Check key={i} className="h-4 w-4 fill-current" />)}
                         </div>
                         <p className="text-xs font-black text-slate-900 uppercase tracking-widest">5,000+ Happy Sellers</p>
                      </div>
                   </div>
                   <blockquote className="text-lg font-bold text-slate-700 italic leading-relaxed mb-6">
                      &quot;Upgrading to Pro was the best decision for my brand. The priority search listing increased our sales by 40% in just two weeks!&quot;
                   </blockquote>
                   <div className="flex items-center gap-3">
                      <div className="h-1 bg-amber-500 w-12 rounded-full" />
                      <span className="font-black text-sm text-slate-900 tracking-tighter">— Rajesh Kumar, Founder of EcoHome India</span>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCcw(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
      </svg>
    )
}
