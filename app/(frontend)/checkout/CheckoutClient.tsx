
"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { createCheckout } from "./actions/createCheckout";
import { Button } from "@/components/ui/button";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addresses: any[];
  userId: string;
}

export default function CheckoutClient({ addresses }: Props) {
  const { cart } = useCart();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!addressId) {
      setError("Please select an address");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createCheckout({
      items: cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        quantity: i.quantity,
      })),
      addressId,
      paymentMethod,
    });

    if (!res.ok) {
      setError(res.error || "Something went wrong");
      setLoading(false);
      return;
    }

    // Razorpay comes next step
    console.log("ORDER(S) CREATED:", res.orderIds);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Address */}
      <div className="space-y-2">
        <h3 className="font-semibold">Shipping Address</h3>
        {addresses.map((a) => (
          <label key={a.id} className="block border p-3 rounded">
            <input
              type="radio"
              name="address"
              value={a.id}
              onChange={() => setAddressId(a.id)}
            />
            <span className="ml-2">
              {a.firstName} {a.lastName}, {a.city}
            </span>
          </label>
        ))}
      </div>

      {/* Payment */}
      <div>
        <h3 className="font-semibold">Payment Method</h3>
        <select
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(e.target.value as "razorpay" | "cod")
          }
        >
          <option value="razorpay">Online Payment</option>
          <option value="cod">Cash on Delivery</option>
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Button onClick={handleCheckout} disabled={loading}>
        {loading ? "Processing..." : "Place Order"}
      </Button>
    </div>
  );
}
