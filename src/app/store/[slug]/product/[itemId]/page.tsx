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
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  ChevronRight,
  Clock,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (error || !vendor || !item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="text-lg font-semibold text-slate-900">{error || "Product not found"}</p>
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

  const desc = item.description || item.shortDescription;
  const images = item.images.length ? item.images : [];
  const isService = item.type === "service";
  const inStock = !isService && item.stock != null && item.stock > 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Consistent Kurospace header — same on every product page */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href={`/store/${vendor.slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {vendor.businessName}
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/store/${vendor.slug}`}
              className="hidden text-sm font-medium text-slate-600 transition hover:text-teal-800 sm:inline"
            >
              View store
            </Link>
            <Link
              href={`/store/${vendor.slug}/cart`}
              className="relative inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 ring-2 ring-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/marketplace" className="transition hover:text-teal-800">
            Marketplace
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href={`/store/${vendor.slug}`} className="transition hover:text-teal-800">
            {vendor.businessName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate font-medium text-slate-900">{item.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image gallery */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[3/4]">
                {images[activeImage] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[activeImage]}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                    <Store className="h-16 w-16" />
                  </div>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`h-20 w-16 overflow-hidden rounded-lg border-2 transition ${
                      i === activeImage
                        ? "border-teal-700 ring-2 ring-teal-700/20"
                        : "border-slate-200 hover:border-teal-700/50"
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="teal" className="capitalize">
                  {item.type}
                </Badge>
                {item.category ? <Badge variant="default">{item.category}</Badge> : null}
                {isService && item.bookingRequired ? (
                  <Badge variant="warning">Booking required</Badge>
                ) : null}
                {inStock ? (
                  <Badge variant="success">In stock</Badge>
                ) : isService ? (
                  <Badge variant="info">Available on demand</Badge>
                ) : item.stock != null && item.stock === 0 ? (
                  <Badge variant="danger">Out of stock</Badge>
                ) : null}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {item.name}
              </h1>

              <div className="mt-4 flex items-end gap-3">
                <p className="text-3xl font-bold text-teal-800">{formatNaira(item.price)}</p>
                {item.compareAtPrice != null && item.compareAtPrice > item.price && (
                  <p className="pb-0.5 text-lg text-slate-400 line-through">
                    {formatNaira(item.compareAtPrice)}
                  </p>
                )}
              </div>

              {/* Quantity + actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <button
                    type="button"
                    className="p-2.5 text-slate-600 transition hover:text-teal-800 disabled:opacity-40"
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
                    className="p-2.5 text-slate-600 transition hover:text-teal-800 disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    disabled={quantity >= 99}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button variant="outline" onClick={addToCart} className="flex-1 sm:flex-none">
                  {added ? "Added ✓" : "Add to cart"}
                </Button>
                <Button onClick={buyNow} className="flex-1 sm:flex-none">
                  Buy now
                </Button>
              </div>
            </div>

            {/* Description */}
            {desc ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
                  <Package className="h-4 w-4 text-teal-700" />
                  Description
                </h2>
                <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
                  {desc}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
                  <Package className="h-4 w-4 text-teal-700" />
                  Description
                </h2>
                <p className="mt-3 text-sm italic text-slate-500">
                  No description provided yet. Contact the vendor for more details.
                </p>
              </section>
            )}

            {/* Quick facts */}
            <dl className="grid grid-cols-2 gap-3">
              {isService && item.durationMinutes ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    Duration
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {item.durationMinutes} min
                  </dd>
                </div>
              ) : null}
              {isService ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Booking
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {item.bookingRequired ? "Required" : "On demand"}
                  </dd>
                </div>
              ) : (
                <>
                  {item.stock != null ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <Package className="h-3.5 w-3.5" />
                        Availability
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                      </dd>
                    </div>
                  ) : null}
                  {item.sku ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <Store className="h-3.5 w-3.5" />
                        SKU
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{item.sku}</dd>
                    </div>
                  ) : null}
                </>
              )}
            </dl>

            {/* Vendor card */}
            <Link
              href={`/store/${vendor.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-teal-700 text-lg font-bold text-white">
                {vendor.logoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  vendor.businessName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sold by
                </p>
                <p className="truncate font-semibold text-slate-900 group-hover:text-teal-800">
                  {vendor.businessName}
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[vendor.address?.city, vendor.address?.state].filter(Boolean).join(", ") ||
                    vendor.category}
                </p>
              </div>
              <span className="ml-auto text-sm font-medium text-teal-700 transition group-hover:translate-x-0.5">
                Visit store →
              </span>
            </Link>
          </div>
        </div>
      </main>

      <CheckoutDialog vendor={vendor} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
