"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { CheckoutDialog } from "@/components/storefront/checkout-dialog";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, ShoppingBag, Store, Trash2 } from "lucide-react";
import type { Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold text-slate-900">{error || "Store not found"}</p>
        <Link href="/marketplace" className="text-sm text-teal-800 hover:underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  if (!vendor.isPublished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold text-slate-900">This store is not published yet.</p>
        <Link href="/" className="text-sm text-teal-800 hover:underline">
          Go to Kurospace
        </Link>
      </div>
    );
  }

  const cartBelongsToOtherStore = Boolean(vendorSlug && vendorSlug !== slug);
  const empty = lines.length === 0;
  const branding = { ...DEFAULT_BRANDING, ...vendor.branding };

  return (
    <StorefrontShell vendor={vendor}>
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: `${branding.backgroundColor}E6`,
          borderColor: `${branding.primaryColor}22`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href={`/store/${vendor.slug}`}
            className="store-muted flex items-center gap-2 text-sm hover:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {vendor.businessName}
          </Link>
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShoppingBag className="h-4 w-4" />
            Cart
            {count > 0 && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: branding.accentColor, color: "#0f172a" }}
              >
                {count}
              </span>
            )}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {cartBelongsToOtherStore ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h1 className="text-lg font-semibold text-amber-900">
              Your cart is from another store
            </h1>
            <p className="mt-1 text-sm text-amber-800">
              Your cart currently holds items from a different store. One order = one store, so
              start a fresh cart to shop here.
            </p>
            <Button className="mt-4" onClick={clear}>
              Start fresh cart
            </Button>
          </div>
        ) : empty ? (
          <div className="store-card flex flex-col items-center justify-center bg-white px-6 py-16 text-center">
            <Store className="h-12 w-12 text-slate-300" />
            <h1 className="store-heading mt-3 text-lg">Your cart is empty</h1>
            <p className="store-muted mt-1 max-w-sm text-sm">
              Browse {vendor.businessName}&apos;s catalog and add something you like.
            </p>
            <Link href={`/store/${vendor.slug}`}>
              <Button className="mt-5" style={{ background: branding.primaryColor }}>
                Continue shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="store-heading mb-5 text-2xl">Your cart</h1>
            <ul className="space-y-3">
              {lines.map((line) => (
                <li
                  key={line.item.id}
                  className="store-card flex gap-4 bg-white p-4"
                >
                  <Link
                    href={`/store/${vendor.slug}/product/${line.item.id}`}
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                  >
                    {line.item.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.item.images[0]}
                        alt={line.item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/store/${vendor.slug}/product/${line.item.id}`}
                          className="store-heading line-clamp-1 text-sm hover:opacity-80"
                        >
                          {line.item.name}
                        </Link>
                        <p className="store-muted mt-0.5 text-xs">
                          {formatNaira(line.item.price)} each
                        </p>
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
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-lg border border-slate-300">
                        <button
                          type="button"
                          className="p-2 text-slate-600 hover:opacity-80 disabled:opacity-40"
                          onClick={() => setQuantity(line.item.id, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-2 text-slate-600 hover:opacity-80 disabled:opacity-40"
                          onClick={() => setQuantity(line.item.id, line.quantity + 1)}
                          disabled={line.quantity >= 99}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Badge variant="teal" className="capitalize">
                        {line.item.type}
                      </Badge>
                      <p className="text-sm font-bold" style={{ color: branding.primaryColor }}>
                        {formatNaira(line.item.price * line.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="store-card mt-5 bg-white p-5">
              <div className="store-muted flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatNaira(total)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatNaira(total)}</span>
              </div>
              <Button
                className="store-btn-primary mt-4 w-full"
                onClick={() => setCheckoutOpen(true)}
                style={{ background: branding.primaryColor }}
              >
                Proceed to checkout
              </Button>
              <p className="store-muted mt-3 text-center text-xs">
                You&apos;ll enter delivery details and pay securely with Bachs on the next step.
              </p>
            </div>
          </>
        )}
      </main>

      <CheckoutDialog vendor={vendor} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </StorefrontShell>
  );
}
