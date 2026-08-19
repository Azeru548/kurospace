"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { CheckoutDialog } from "@/components/storefront/checkout-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import type { Vendor } from "@/types";

export default function StoreCartPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const { lines, vendorSlug, total, count, setQuantity, removeItem, clear } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const v = await getVendorBySlug(slug);
        if (!v) {
          setError("Store not found.");
          return;
        }
        setVendor(v);
      } catch (e) {
        console.error(e);
        setError("Could not load store. Check Firebase configuration.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="text-lg font-semibold text-slate-900">{error || "Store not found"}</p>
        <Link href="/marketplace" className="text-sm font-medium text-teal-800 hover:underline">
          Browse marketplace
        </Link>
      </div>
    );
  }

  if (!vendor.isPublished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
        <Store className="h-10 w-10 text-slate-300" />
        <p className="text-lg font-semibold text-slate-900">This store is not published yet.</p>
        <Link href="/" className="text-sm font-medium text-teal-800 hover:underline">
          Go to Kurospace
        </Link>
      </div>
    );
  }

  const cartBelongsToOtherStore = Boolean(vendorSlug && vendorSlug !== slug);
  const empty = lines.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href={`/store/${vendor.slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {vendor.businessName}
          </Link>
          <span className="relative inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm">
            <ShoppingBag className="h-4 w-4" />
            Cart
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 ring-2 ring-white">
                {count}
              </span>
            )}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/marketplace" className="transition hover:text-teal-800">
            Marketplace
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href={`/store/${vendor.slug}`} className="transition hover:text-teal-800">
            {vendor.businessName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-900">Cart</span>
        </nav>

        {cartBelongsToOtherStore ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <ShoppingBag className="mx-auto h-10 w-10 text-amber-500" />
            <h1 className="mt-3 text-lg font-semibold text-slate-900">
              Your cart is from another store
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              Your cart currently holds items from a different store. One order = one store, so
              start a fresh cart to shop here.
            </p>
            <Button className="mt-5" onClick={clear}>
              Start fresh cart
            </Button>
          </div>
        ) : empty ? (
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Your cart is empty</h1>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Browse {vendor.businessName}&apos;s catalog and add something you like.
            </p>
            <Link href={`/store/${vendor.slug}`}>
              <Button className="mt-6">Continue shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">Your cart</h1>
              <ul className="space-y-3">
                {lines.map((line) => (
                  <li
                    key={line.item.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <Link
                      href={`/store/${vendor.slug}/product/${line.item.id}`}
                      className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100"
                    >
                      {line.item.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.item.images[0]}
                          alt={line.item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Store className="h-6 w-6" />
                        </div>
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/store/${vendor.slug}/product/${line.item.id}`}
                            className="line-clamp-1 text-sm font-semibold text-slate-900 transition hover:text-teal-800"
                          >
                            {line.item.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatNaira(line.item.price)} each
                          </p>
                          <Badge variant="teal" className="mt-1.5 capitalize">
                            {line.item.type}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(line.item.id)}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${line.item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                          <button
                            type="button"
                            className="p-2 text-slate-600 transition hover:text-teal-800 disabled:opacity-40"
                            onClick={() => setQuantity(line.item.id, line.quantity - 1)}
                            disabled={line.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-900">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="p-2 text-slate-600 transition hover:text-teal-800 disabled:opacity-40"
                            onClick={() => setQuantity(line.item.id, line.quantity + 1)}
                            disabled={line.quantity >= 99}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-teal-800">
                          {formatNaira(line.item.price * line.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                Order summary
              </h2>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                  Subtotal ({count} {count === 1 ? "item" : "items"})
                </span>
                <span className="font-medium text-slate-900">{formatNaira(total)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span className="text-teal-800">{formatNaira(total)}</span>
              </div>
              <Button className="mt-5 w-full" size="lg" onClick={() => setCheckoutOpen(true)}>
                Proceed to checkout
              </Button>
              <p className="mt-3 text-center text-xs text-slate-500">
                You&apos;ll enter delivery details and pay securely with Bachs on the next step.
              </p>
              <Link
                href={`/store/${vendor.slug}`}
                className="mt-3 block text-center text-sm font-medium text-teal-800 hover:underline"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>

      <CheckoutDialog vendor={vendor} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
