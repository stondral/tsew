"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CreditCard,
  Wallet,
  Truck,
  Lock,
  Check,
  MapPin,
  User,
  Mail,
  Phone,
  Home,
  Loader2,
} from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { createCheckout } from "./actions/createCheckout";
import { calculateCheckoutTotals } from "./actions/calculateCheckoutTotals";
import { createRazorpayIntent } from "./actions/createRazorpayIntent";
import { finaliseRazorpayCheckout } from "./actions/finaliseRazorpayCheckout";
import { createAddress } from "./actions/createAddress";
import { CalculationResult } from "@/lib/cart/calculations";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  email?: string;
  phone?: string;
}

interface CartItemWithProduct {
  productId: string;
  variantId?: string | null;
  quantity: number;
  name: string;
  price: number;
}

interface Props {
  addresses: Address[];
  userId: string;
  cartItems?: CartItemWithProduct[];
}

export default function PremiumCheckout({
  addresses,
  userId: _userId,
  cartItems,
}: Props) {
  const router = useRouter();
  const { cart, isLoading: isCartLoading } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay",
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  
  // Processing state (Place Order)
  const [loading, setLoading] = useState(false);
  
  // Calculation state (Price check)
  const [calculating, setCalculating] = useState(true);
  const [totals, setTotals] = useState<CalculationResult | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // Form state for new address
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [showNewAddress, setShowNewAddress] = useState(false);

  // Use props if available (SSR), otherwise use client cart
  const items = cartItems || cart.items;

  // 1️⃣  Effect: Fetch Verified Totals on Mount
  useEffect(() => {
    // If cart is still loading from local storage, wait
    if (isCartLoading && !cartItems) return;

    async function fetchTotals() {
      setCalculating(true);
      const res = await calculateCheckoutTotals(
        items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        }))
      );
      
      if (res.ok && res.data) {
        setTotals(res.data);
      } else {
        if (items.length > 0) {
            setError(res.error || "Failed to calculate prices");
        }
      }
      setCalculating(false);
    }

    if (items.length > 0) {
      fetchTotals();
    } else {
      setCalculating(false);
    }
  }, [items, isCartLoading, cartItems]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    if (!selectedAddressId && !showNewAddress) {
      setError("Please select or add an address");
      return;
    }
    
    // Block if calculation failed or stock issue
    if (!totals || totals.isStockProblem) {
       setError("Cannot proceed: Please address stock issues.");
       return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalAddressId = selectedAddressId;

      // 1. Create address if new
      if (showNewAddress) {
        const addressRes = await createAddress({
          ...formData,
          addressType: "home",
        });

        if (!addressRes.ok || !addressRes.addressId) {
          setError(addressRes.error || "Failed to save address");
          setLoading(false);
          return;
        }
        finalAddressId = addressRes.addressId;
      }

      const checkoutItems = items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        quantity: i.quantity,
      }));

      // 2. Handle Razorpay (Order creation AFTER payment)
      if (paymentMethod === "razorpay") {
        const intentRes = await createRazorpayIntent(checkoutItems);
        
        if (intentRes.ok && intentRes.razorpay) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof (window as any).Razorpay === "undefined") {
             setError("Razorpay SDK not loaded. Please refresh.");
             setLoading(false);
             return;
          }

          const options = {
            key: intentRes.razorpay.key,
            amount: intentRes.razorpay.amount,
            currency: intentRes.razorpay.currency,
            name: "Stond Emporium",
            description: "Checkout Payment",
            image: intentRes.items?.[0]?.image || "", 
            order_id: intentRes.razorpay.orderId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handler: async function (response: any) {
              setLoading(true);
              // Finalise: Verify and Create Order
              const finalRes = await finaliseRazorpayCheckout({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                items: checkoutItems,
                addressId: finalAddressId!,
                guestEmail: formData.email,
                guestPhone: formData.phone,
              });

              if (finalRes.ok && finalRes.orderId) {
                router.push(`/order-success?orderId=${finalRes.orderId}`);
              } else {
                setError(finalRes.error || "Payment successful but order creation failed. Contact support.");
                setLoading(false);
              }
            },
            prefill: {
              name: showNewAddress ? `${formData.firstName} ${formData.lastName}` : "Customer",
              email: formData.email || "",
              contact: formData.phone || "",
            },
            theme: { color: "#f97316" },
          };
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rzp = new (window as any).Razorpay(options);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rzp.on('payment.failed', function (response: any) {
            setError(`Payment Failed: ${response.error.description}`);
            setLoading(false);
          });
          rzp.open();
        } else {
          setError(intentRes.error || "Razorpay init failed");
          setLoading(false);
        }
      } 
      // 3. Handle COD (Immediate creation)
      else {
        const res = await createCheckout({
          items: checkoutItems,
          addressId: finalAddressId!,
          paymentMethod: "cod",
          guestEmail: formData.email,
          guestPhone: formData.phone,
        });

        if (res.ok && res.orderId) {
          router.push(`/order-success?orderId=${res.orderId}`);
        } else {
          setError(res.error || "Checkout failed");
          setLoading(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-12">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6 md:mb-8">
            Secure Checkout
        </h1>
        
        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold shrink-0">
                    1
                  </div>
                  <span className="hidden sm:inline font-semibold text-gray-800 text-sm">Shipping</span>
                </div>
                <div className="h-1 flex-1 mx-2 md:mx-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm md:text-base font-semibold shrink-0">
                    2
                  </div>
                  <span className="hidden sm:inline font-semibold text-gray-400 text-sm">Payment</span>
                </div>
                <div className="h-1 flex-1 mx-2 md:mx-4 bg-gray-200 rounded"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-sm md:text-base font-semibold shrink-0">
                    3
                  </div>
                  <span className="hidden sm:inline font-semibold text-gray-400 text-sm">Review</span>
                </div>
              </div>
            </div>

            {/* Stock Error Banner */}
            {totals?.isStockProblem && totals.stockErrors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">
                      Stock Issues Detected
                    </h3>
                    <p className="text-sm text-red-700 mb-3">
                      The following items have insufficient stock. Please adjust quantities or remove them from your cart.
                    </p>
                    <ul className="space-y-2">
                      {totals.stockErrors.map((error, idx) => (
                        <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-orange-100">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Shipping Information
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="block border-2 rounded-xl p-4 cursor-pointer transition-all hover:border-orange-200"
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => {
                        setSelectedAddressId(address.id);
                        setShowNewAddress(false);
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {address.firstName} {address.lastName}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {address.address}, {address.city}, {address.state} -{" "}
                          {address.pincode}
                        </div>
                      </div>
                      {selectedAddressId === address.id && (
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowNewAddress(!showNewAddress);
                  if (!showNewAddress) setSelectedAddressId(null);
                }}
                className="w-full py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition-all font-medium"
              >
                {showNewAddress ? "Cancel" : "+ Add New Address"}
              </button>

              {showNewAddress && (
                <div className="mt-6 space-y-5 border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none placeholder:text-gray-400"
                          placeholder="John"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none placeholder:text-gray-400"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none placeholder:text-gray-400"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none placeholder:text-gray-400"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none resize-none placeholder:text-gray-400"
                        placeholder="123 Main Street, Apartment 4B"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Maharashtra"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white text-gray-900 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all outline-none placeholder:text-gray-400"
                        placeholder="400001"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-orange-100">
              <div className="flex items-center space-x-3 mb-6">
                <Wallet className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-4">
                <div
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`relative p-4 md:p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "razorpay"
                      ? "border-orange-400 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-lg truncate">Razorpay</h3>
                        <p className="text-sm text-gray-500 truncate">Card, UPI, Netbanking & more</p>
                      </div>
                    </div>
                    {paymentMethod === "razorpay" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`relative p-4 md:p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-orange-400 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-lg truncate">Cash on Delivery</h3>
                        <p className="text-sm text-gray-500 truncate">Pay when you receive</p>
                      </div>
                    </div>
                    {paymentMethod === "cod" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-orange-100 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
              
              {calculating ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                     <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                     <p className="text-sm text-gray-500">Verifying prices...</p>
                  </div>
              ) : totals ? (
                <>
                <div className="space-y-4 mb-6">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {totals.items.map((item: any) => (
                    <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-start gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex-shrink-0 overflow-hidden relative border border-orange-50">
                          {item.image ? (
                               <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-orange-300">
                                  <Truck className="w-6 h-6" />
                              </div>
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm md:text-base leading-tight md:leading-normal">{item.name}</h4>
                        <div className="flex justify-between items-center mt-1">
                             <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                             {item.stock < item.quantity && (
                                 <span className="text-[10px] text-red-500 font-bold px-1 py-0.5 bg-red-50 rounded">Out of Stock</span>
                             )}
                        </div>
                        <div className="mt-1 font-bold text-gray-900 md:hidden">
                            ₹{item.subtotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <span className="hidden md:block font-semibold text-gray-800 shrink-0">₹{item.subtotal.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={totals.shipping === 0 ? "text-green-600 font-medium" : ""}>
                      {totals.shipping === 0 ? "Free" : `₹${totals.shipping.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST)</span>
                    <span className="text-green-600 font-medium">INCLUDED</span>
                  </div>
                  {totals.platformFee > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Platform Fee</span>
                        <span>₹{totals.platformFee.toLocaleString("en-IN")}</span>
                      </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-orange-600">₹{totals.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {totals.isStockProblem && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      <strong>Cannot Proceed:</strong>
                      <ul className="list-disc list-inside mt-1">
                          {totals.stockErrors.map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                          ))}
                      </ul>
                  </div>
                )}
                </>
              ) : items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Your cart is empty.</div>
              ) : (
                  <div className="text-center py-8 text-gray-500">Could not load order summary.</div>
              )}

              {error && !totals?.isStockProblem && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading || calculating || !totals || totals.isStockProblem}
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Place Order"}
              </button>

              <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Secure SSL encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
