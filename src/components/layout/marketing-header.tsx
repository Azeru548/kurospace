"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand/brand-logo";

export function MarketingHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <BrandLockup />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <Link href="/#features" className="hover:text-teal-800">
            Features
          </Link>
          <Link href="/products" className="hover:text-teal-800">
            Products
          </Link>
          <Link href="/marketplace" className="hover:text-teal-800">
            Stores
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {!loading && user ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Start selling</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
