"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listPublicCatalogItems } from "@/lib/firebase/catalog";
import { getVendorsByIds } from "@/lib/firebase/vendors";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/utils";
import { Package, Search, Store } from "lucide-react";
import type { CatalogItem, Vendor } from "@/types";

type FilterTab = "all" | "product" | "service";

export default function ProductsPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [vendors, setVendors] = useState<Map<string, Vendor>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const catalog = await listPublicCatalogItems({ limitCount: 96 });
        // Only show items from published vendors
        const vendorMap = await getVendorsByIds(catalog.map((i) => i.vendorId));
        const published = catalog.filter((item) => {
          const v = vendorMap.get(item.vendorId);
          return v?.isPublished === true;
        });
        setItems(published);
        setVendors(vendorMap);
      } catch (e) {
        console.error(e);
        setError(
          "Could not load products. Ensure Firebase is configured and composite indexes are deployed."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.type !== filter) return false;
      if (!q) return true;
      const vendor = vendors.get(item.vendorId);
      const haystack = [
        item.name,
        item.shortDescription,
        item.description,
        item.category,
        vendor?.businessName,
        vendor?.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, vendors, filter, search]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products & services</h1>
            <p className="mt-2 max-w-xl text-slate-600">
              Browse listings from Nigerian businesses on Kurospace. Open a card to visit the
              vendor&apos;s store and order.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="text-sm font-medium text-teal-800 hover:underline"
          >
            Browse stores →
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "all", label: "All" },
                { id: "product", label: "Products" },
                { id: "service", label: "Services" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  filter === tab.id
                    ? "bg-teal-800 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or stores…"
              className="pl-9"
              aria-label="Search products"
            />
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading listings…</p>}
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              {items.length === 0
                ? "No active listings yet. Vendors can publish products from their dashboard."
                : "No listings match your filters."}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => {
            const vendor = vendors.get(item.vendorId);
            const href = vendor
              ? `/store/${vendor.slug}/product/${item.id}`
              : "/marketplace";
            const desc = item.shortDescription || item.description;

            return (
              <Link key={item.id} href={href} className="group">
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:border-teal-200 group-hover:shadow-md">
                  {/* Portrait image — Shopify-style taller than wide */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
                    {item.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                    <Badge
                      variant="default"
                      className="absolute left-2 top-2 bg-white/95 capitalize shadow-sm"
                    >
                      {item.type}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
                    <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">
                      {item.name}
                    </h2>
                    {desc && (
                      <p className="line-clamp-2 text-xs text-slate-500">{desc}</p>
                    )}
                    <p className="mt-auto pt-1 text-sm font-semibold text-teal-800 sm:text-base">
                      {formatNaira(item.price)}
                      {item.compareAtPrice != null && item.compareAtPrice > item.price && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400 line-through">
                          {formatNaira(item.compareAtPrice)}
                        </span>
                      )}
                    </p>
                    {vendor && (
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                        <Store className="h-3 w-3 shrink-0" />
                        <span className="truncate">{vendor.businessName}</span>
                      </p>
                    )}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
