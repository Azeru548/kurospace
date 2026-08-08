"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { listPublicCatalogItems } from "@/lib/firebase/catalog";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Package, Search, Store } from "lucide-react";
import type { CatalogItem, Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

export default function MarketplacePage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const db = getClientDb();
        const q = query(
          collection(db, COLLECTIONS.vendors),
          where("isPublished", "==", true),
          limit(48)
        );
        const snaps = await getDocs(q);
        setVendors(
          snaps.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              businessName: data.businessName,
              slug: data.slug,
              description: data.description,
              category: data.category,
              tags: data.tags ?? [],
              logoURL: data.logoURL,
              coverURL: data.coverURL,
              branding: { ...DEFAULT_BRANDING, ...data.branding },
              plan: data.plan ?? "free",
              storefrontEnabled: data.storefrontEnabled ?? true,
              isPublished: data.isPublished,
              address: data.address,
              stats: data.stats,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            } as Vendor;
          })
        );
        const items = await listPublicCatalogItems({ limitCount: 96 });
        setCatalog(items);
      } catch (e) {
        console.error(e);
        setError(
          "Could not load marketplace. Add Firebase config and publish rules, then publish a vendor store."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => {
      const haystack = [
        v.businessName,
        v.description,
        v.category,
        v.address?.city,
        v.address?.state,
        ...(v.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [vendors, search]);

  const productsByVendor = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of catalog) {
      const list = map.get(item.vendorId) ?? [];
      list.push(item);
      map.set(item.vendorId, list);
    }
    return map;
  }, [catalog]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Marketplace</h1>
            <p className="mt-2 max-w-xl text-slate-600">
              Discover Nigerian businesses on Kurospace. Visit their branded storefronts to shop or
              request services.
            </p>
          </div>
          <Link href="/products" className="text-sm font-medium text-teal-800 hover:underline">
            Browse products →
          </Link>
        </div>

        <div className="mb-6 max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search businesses…"
              className="pl-9"
              aria-label="Search businesses"
            />
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading vendors…</p>}
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              {vendors.length === 0 ? (
                <>
                  No published vendors yet. Be the first —{" "}
                  <Link href="/signup" className="font-medium text-teal-800 hover:underline">
                    create a store
                  </Link>
                  .
                </>
              ) : (
                "No businesses match your search."
              )}
            </CardContent>
          </Card>
        )}

        {/* Portrait vendor cards — taller than wide, more company context */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => {
            const primary = v.branding?.primaryColor || "#0F766E";
            const secondary = v.branding?.secondaryColor || "#134E4A";
            const productCount = v.stats?.productCount ?? 0;
            const serviceCount = v.stats?.serviceCount ?? 0;
            const listingCount = productCount + serviceCount;
            const location = [v.address?.city, v.address?.state].filter(Boolean).join(", ");
            const previews = (productsByVendor.get(v.id) ?? []).slice(0, 3);

            return (
              <article
                key={v.id}
                className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-lg"
                onClick={() => router.push(`/store/${v.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/store/${v.slug}`);
                  }
                }}
                role="link"
                tabIndex={0}
              >
                {/* Cover — tall hero band */}
                <div
                  className="relative h-36 w-full sm:h-40"
                  style={{
                    background: v.coverURL
                      ? `center/cover url(${v.coverURL})`
                      : `linear-gradient(135deg, ${primary}, ${secondary})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                  <Badge className="absolute right-3 top-3 bg-white/95 text-slate-700 shadow-sm">
                    {v.category}
                  </Badge>
                </div>

                {/* Logo overlapping cover */}
                <div className="relative px-4">
                  <div
                    className="-mt-9 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white text-xl font-bold text-white shadow-md"
                    style={{ background: primary }}
                  >
                    {v.logoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.logoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      v.businessName.charAt(0)
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 px-4 pb-5 pt-3">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight text-slate-900 group-hover:text-teal-900">
                      {v.businessName}
                    </h2>
                    {location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {location}
                      </p>
                    )}
                  </div>

                  {v.description ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {v.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      Visit this store to explore their catalog.
                    </p>
                  )}

                  {/* Product preview strip — links straight to a store's products */}
                  {previews.length > 0 && (
                    <div className="flex gap-2">
                      {previews.map((item) => (
                        <Link
                          key={item.id}
                          href={`/store/${v.slug}/product/${item.id}`}
                          className="block h-16 w-14 overflow-hidden rounded-lg bg-slate-100 transition group-hover:ring-2 group-hover:ring-teal-200"
                          title={item.name}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              {item.type === "service" ? "Service" : "Item"}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    <Badge variant="teal" className="font-normal">
                      <Store className="mr-1 h-3 w-3" />
                      {v.slug}.kurospace.com
                    </Badge>
                    {listingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Package className="h-3 w-3" />
                        {listingCount} listing{listingCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <span
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white transition group-hover:opacity-90"
                    style={{ background: primary }}
                  >
                    Visit store
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
