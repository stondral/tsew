"use client";

import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/CartContext";
import { verifyPayment } from "../checkout/actions/verifyPayment";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const cartCleared = useRef(false);

  // Handle both single orderId (legacy) and multiple orderIds (new)
  const orderId = searchParams.get("orderId");
  const orderIdsString = searchParams.get("orderIds");
  const checkoutId = searchParams.get("checkoutId");
  
  const paymentId = searchParams.get("paymentId");
  const razorpayOrderId = searchParams.get("razorpayOrderId"); // From Razorpay callback
  const signature = searchParams.get("signature");

  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "failed">("loading");
  const [method, setMethod] = useState<string | null>(null);
  
  // Parse order IDs
  const orderIds = useMemo(() => 
    orderIdsString ? orderIdsString.split(',') : (orderId ? [orderId] : []),
    [orderIdsString, orderId]
  );
  const primaryOrderId = orderIds[0];

  useEffect(() => {
    if (orderIds.length === 0) {
      router.push("/");
      return;
    }

    const performVerification = async () => {
      // 1. If we have signature, verify immediately (using first order ID)
      if (paymentId && (razorpayOrderId || checkoutId) && signature) {
        setMethod("razorpay");
        const res = await verifyPayment({
            orderId: primaryOrderId,
            razorpayPaymentId: paymentId,
            razorpayOrderId: razorpayOrderId || checkoutId!,
            razorpaySignature: signature
        });

        if (res.ok) {
            setStatus("paid");
            if (!cartCleared.current) {
                clearCart();
                cartCleared.current = true;
            }
            return;
        }
      }

      // 2. Poll status or check if it's COD
      const checkStatus = async (count = 0) => {
        try {
          // Check the first order of the group
          const res = await fetch(`/api/orders/status?orderId=${primaryOrderId}`);
          const data = await res.json();
          setMethod(data.paymentMethod);

          // If it's COD, we don't wait for 'paid' status
          if (data.paymentMethod === "cod") {
            setStatus("paid"); 
            if (!cartCleared.current) {
                clearCart();
                cartCleared.current = true;
            }
            return;
          }

          if (data.paymentStatus === "paid") {
            setStatus("paid");
            if (!cartCleared.current) {
                clearCart();
                cartCleared.current = true;
            }
          } else if (data.paymentStatus === "failed") {
            setStatus("failed");
          } else if (count < 15) {
            setTimeout(() => checkStatus(count + 1), 3000);
          } else {
            setStatus("pending");
          }
        } catch (e) {
          console.error("Failed to check order status", e);
          setStatus("pending");
        }
      };

      checkStatus();
    };

    performVerification();
  }, [orderIds, primaryOrderId, paymentId, razorpayOrderId, checkoutId, signature, router, clearCart]);

  if (status === "loading") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-800">
            {method === "cod" ? "Confirming your order..." : "Confirming your payment..."}
        </h1>
        <p className="text-gray-500">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (status === "failed") {
      router.push(`/order-failure?orderIds=${orderIds.join(',')}`);
      return null;
  }

  return (
    <div className="min-h-screen bg-white py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Order Confirmed!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {method === "cod" 
            ? "Thank you for your order. We&apos;ll collect the payment when we deliver your items."
            : "Thank you for your order. We&apos;ve received your payment and are getting your items ready."
          }
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 md:p-8 border border-gray-100 mb-12 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">
                {orderIds.length > 1 ? "Order Numbers" : "Order Number"}
              </p>
              <div className="flex flex-wrap gap-2">
                {orderIds.map((id) => (
                  <p key={id} className="text-base font-mono font-bold text-gray-800 break-all bg-white px-2 py-1 rounded border border-gray-100 italic">
                    {id}
                  </p>
                ))}
              </div>
              {checkoutId && (
                <p className="mt-2 text-[10px] text-gray-400">Checkout ID: {checkoutId}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Payment Method</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {method === "cod" ? "Cash on Delivery" : "Razorpay Online"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-white p-2 rounded-lg shadow-sm">
                <Package className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Processing Your Order</p>
                <p className="text-gray-600 text-sm">We&apos;ll notify you once your order has been shipped.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
                <div className="mt-1 bg-white p-2 rounded-lg shadow-sm">
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <p className="font-semibold text-gray-800">What&apos;s Next?</p>
                    <p className="text-gray-600 text-sm">You&apos;ll receive an email confirmation shortly with all the details.</p>
                </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 h-14 px-8 text-lg font-semibold rounded-xl transition-all">
            <Link href="/orders">View My Orders</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold rounded-xl border-gray-200 hover:bg-gray-50 transition-all">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
