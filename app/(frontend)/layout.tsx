import React from "react";
import "@/app/globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import { CartProvider } from "@/components/cart/CartContext";
import ConditionalLayout from "@/app/(frontend)/conditional-layout";

interface LayoutProps {
  children: React.ReactNode;
}

import { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  },
};

import Script from "next/script";

const Layout = ({ children }: LayoutProps) => {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="relative z-0 flex flex-col min-h-screen bg-background">
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </div>
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </CartProvider>
    </AuthProvider>
  );
};

export default Layout;
