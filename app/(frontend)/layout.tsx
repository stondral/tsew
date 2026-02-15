  import React from "react";
import "@/app/globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/products/WishlistContext";
import ConditionalLayout from "@/app/(frontend)/conditional-layout";
import LazyChatButton from "@/components/support/LazyChatButton";
import { getServerCart } from "@/lib/cart/server";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = async ({ children }: LayoutProps) => {
  // Fetch cart on server to avoid client-side API call
  const initialCart = await getServerCart();
  
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider initialCart={initialCart}>
          <div className="relative z-0 flex flex-col min-h-screen bg-background">
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </div>
          <LazyChatButton />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
};

export default Layout;
