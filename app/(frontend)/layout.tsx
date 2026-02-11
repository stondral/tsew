  import React from "react";
import "@/app/globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/products/WishlistContext";
import ConditionalLayout from "@/app/(frontend)/conditional-layout";

interface LayoutProps {
  children: React.ReactNode;
}

import Script from "next/script";
import { ChatButton } from "@/components/support/ChatButton";

const Layout = ({ children }: LayoutProps) => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className="relative z-0 flex flex-col min-h-screen bg-background">
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </div>
          <ChatButton />
          <Script 
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="afterInteractive"
          />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
};

export default Layout;
