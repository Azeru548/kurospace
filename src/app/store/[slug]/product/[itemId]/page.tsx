"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCatalogItem } from "@/lib/firebase/catalog";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { CheckoutDialog } from "@/components/storefront/checkout-dialog";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Minus, Plus, Store } from "lucide-react";
import type { CatalogItem, Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

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
  const branding = { ...DEFAULT_BRANDING, ...vendor.branding };

  return (
    <StorefrontShell vendor={vendor}>
      {/* Slim storefront-style header so the product page keeps vendor context */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: `${branding.backgroundColor}E6`,
          borderColor: `${branding.primaryColor}22`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/store/${vendor.slug}`} className="store-muted flex items-center gap-2 text-sm hover:opacity-80">
            ← Back to {vendor.businessName}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/store/${vendor.slug}`}
              className="store-muted text-sm font-medium hover:opacity-80"
            >
              View store
            </Link>
            <Link
              href={`/store/${vendor.slug}/cart`}
              className="store-btn-primary relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white"
              style={{ background: branding.primaryColor }}
            >
              <Store className="h-4 w-4" />
              Cart
              {count > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: branding.accentColor, color: "#0f172a" }}
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image gallery */}
          <div>
            <div className="store-card aspect-[3/4] overflow-hidden bg-white">
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
                      i === activeImage ? "border-slate-700" : "border-slate-200 hover:border-slate-300"
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

            <h1
              className="store-heading text-3xl"
              style={{ fontFamily: branding.headingFont || branding.fontFamily }}
            >
              {item.name}
            </h1>

            <div>
              <p className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
                {formatNaira(item.price)}
              </p>
              {item.compareAtPrice != null && item.compareAtPrice > item.price && (
                <p className="text-sm text-slate-400 line-through">
                  {formatNaira(item.compareAtPrice)}
                </p>
              )}
            </div>

            {desc && (
              <div className="store-muted prose-sm max-w-none whitespace-pre-line">
                <p className="leading-relaxed">{desc}</p>
              </div>
            )}

            {/* Service-specific info */}
            {item.type === "service" && (
              <dl className="store-card grid grid-cols-2 gap-3 bg-white p-4 text-sm">
                {item.durationMinutes ? (
                  <div>
                    <dt className="text-xs uppercase opacity-50">Duration</dt>
                    <dd className="font-medium">{item.durationMinutes} min</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs uppercase opacity-50">Booking</dt>
                  <dd className="font-medium">
                    {item.bookingRequired ? "Required" : "On demand"}
                  </dd>
                </div>
              </dl>
            )}

            {/* Product-specific info */}
            {item.type === "product" && item.stock != null && (
              <p className="store-muted text-sm">
                {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
              </p>
            )}

            {/* Quantity + actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                <button
                  type="button"
                  className="p-2.5 text-slate-600 hover:opacity-80 disabled:opacity-40"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="p-2.5 text-slate-600 hover:opacity-80 disabled:opacity-40"
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
              className="store-card mt-2 flex items-center gap-3 bg-white p-4 transition hover:shadow-md"
            >
              <div
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg text-lg font-bold text-white"
                style={{ background: branding.primaryColor }}
              >
                {vendor.logoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  vendor.businessName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="store-heading text-sm font-semibold">{vendor.businessName}</p>
                <p className="store-muted flex items-center gap-1 truncate text-xs">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[vendor.address?.city, vendor.address?.state].filter(Boolean).join(", ") ||
                    vendor.category}
                </p>
              </div>
              <span className="ml-auto text-xs font-medium" style={{ color: branding.primaryColor }}>
                Visit store →
              </span>
            </Link>
          </div>
        </div>
      </main>

      <CheckoutDialog vendor={vendor} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </StorefrontShell>
  );
}
