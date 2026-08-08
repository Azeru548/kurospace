"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCatalogItem } from "@/lib/firebase/catalog";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { CheckoutDialog } from "@/components/storefront/checkout-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Minus, Plus, Store } from "lucide-react";
import type { CatalogItem, Vendor } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const itemId = String(params.itemId || "");
  const { addItem, count } = useCart();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug || !itemId) return;
    (async () => {
      try {
        const [v, it] = await Promise.all([getVendorBySlug(slug), getCatalogItem(itemId)]);
        if (!v || !it) {
          setError("Product not found.");
          return;
        }
        if (it.vendorId !== v.id) {
          setError("Product not found in this store.");
          return;
        }
        setVendor(v);
        setItem(it);
      } catch (e) {
        console.error(e);
        setError("Could not load product. Check Firebase configuration.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, itemId]);

  function addToCart() {
    if (!item || !vendor) return;
    addItem(item, vendor.id, vendor.slug, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function buyNow() {
    if (!item || !vendor) return;
    addItem(item, vendor.id, vendor.slug, quantity);
    setCheckoutOpen(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (error || !vendor || !item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold text-slate-900">{error || "Product not found"}</p>
        <Link href="/marketplace" className="text-sm text-teal-800 hover:underline">
          Browse marketplace
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

  const desc = item.description || item.shortDescription;
  const images = item.images.length ? item.images : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Slim storefront-style header so the product page keeps vendor context */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/store/${vendor.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-800">
            ← Back to {vendor.businessName}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/store/${vendor.slug}`}
              className="text-sm font-medium text-slate-600 hover:text-teal-800"
            >
              View store
            </Link>
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="relative flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Store className="h-4 w-4" />
              Cart
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-900">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image gallery */}
          <div>
            <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[activeImage]}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <Store className="h-12 w-12" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-16 overflow-hidden rounded-lg border-2 transition ${
                      i === activeImage ? "border-teal-700" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details + purchase */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="capitalize">
                {item.type}
              </Badge>
              {item.category ? <Badge variant="teal">{item.category}</Badge> : null}
            </div>

            <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>

            <div>
              <p className="text-2xl font-bold text-teal-800">{formatNaira(item.price)}</p>
              {item.compareAtPrice != null && item.compareAtPrice > item.price && (
                <p className="text-sm text-slate-400 line-through">
                  {formatNaira(item.compareAtPrice)}
                </p>
              )}
            </div>

            {desc && (
              <div className="prose-sm max-w-none whitespace-pre-line text-slate-700">
                <p className="leading-relaxed">{desc}</p>
              </div>
            )}

            {/* Service-specific info */}
            {item.type === "service" && (
              <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                {item.durationMinutes ? (
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Duration</dt>
                    <dd className="font-medium text-slate-900">{item.durationMinutes} min</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs uppercase text-slate-500">Booking</dt>
                  <dd className="font-medium text-slate-900">
                    {item.bookingRequired ? "Required" : "On demand"}
                  </dd>
                </div>
              </dl>
            )}

            {/* Product-specific info */}
            {item.type === "product" && item.stock != null && (
              <p className="text-sm text-slate-600">
                {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
              </p>
            )}

            {/* Quantity + actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                <button
                  type="button"
                  className="p-2.5 text-slate-600 hover:text-teal-800 disabled:opacity-40"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="p-2.5 text-slate-600 hover:text-teal-800 disabled:opacity-40"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  disabled={quantity >= 99}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button variant="secondary" onClick={addToCart}>
                {added ? "Added ✓" : "Add to cart"}
              </Button>
              <Button onClick={buyNow}>Buy now</Button>
            </div>

            {/* Vendor card */}
            <Link
              href={`/store/${vendor.slug}`}
              className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-200 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-teal-700 text-lg font-bold text-white">
                {vendor.logoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  vendor.businessName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{vendor.businessName}</p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[vendor.address?.city, vendor.address?.state].filter(Boolean).join(", ") ||
                    vendor.category}
                </p>
              </div>
              <span className="ml-auto text-xs font-medium text-teal-800">Visit store →</span>
            </Link>
          </div>
        </div>
      </main>

      <CheckoutDialog vendor={vendor} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
