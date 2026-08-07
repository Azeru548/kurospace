"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { listCatalogItems } from "@/lib/firebase/catalog";
import { StorefrontView } from "@/components/storefront/storefront-view";
import type { CatalogItem, Vendor } from "@/types";
import Link from "next/link";

export default function StoreBySlugPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
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
        const catalog = await listCatalogItems(v.id, { status: "active" });
        setItems(catalog);
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

  return <StorefrontView vendor={vendor} items={items} />;
}
