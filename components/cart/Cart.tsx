"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "./CartContext";
import CartItemComponent from "./CartItemComponent";

export default function Cart() {
  const { cart, isOpen, setIsOpen, clearCart } = useCart();
  const router = useRouter();

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsOpen(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg h-screen flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Your cart is empty"
              : `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* CART ITEMS */}
          <div className="flex-1 overflow-y-auto pt-4 pb-32 px-4">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItemComponent
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    item={item}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          {cart.items.length > 0 && (
            <div className="flex-shrink-0 border-t bg-background p-4 space-y-2 sticky bottom-0">
              <Button
                onClick={handleCheckout}
                className="w-full bg-orange-600 text-white hover:bg-orange-700 py-4 px-6"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/cart");
                  }}
                  className="flex-1 py-4 px-6"
                >
                  View Full Cart
                </Button>

                <Button
                  variant="ghost"
                  onClick={clearCart}
                  className="flex-1 py-4 px-6 text-destructive hover:text-destructive"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
