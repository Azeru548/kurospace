"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { SiteSplash } from "@/components/brand/site-splash";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <SiteSplash />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
