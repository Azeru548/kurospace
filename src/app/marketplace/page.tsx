"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";
import type { Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              logoURL: data.logoURL,
              branding: { ...DEFAULT_BRANDING, ...data.branding },
              plan: data.plan ?? "free",
              storefrontEnabled: data.storefrontEnabled ?? true,
              isPublished: data.isPublished,
              address: data.address,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            } as Vendor;
          })
        );
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Marketplace</h1>
          <p className="mt-2 text-slate-600">
            Discover Nigerian businesses on Kurospace. Visit their branded storefronts to shop or
            request services.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading vendors…</p>}
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}
        {!loading && !error && vendors.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No published vendors yet. Be the first —{" "}
              <Link href="/signup" className="font-medium text-teal-800 hover:underline">
                create a store
              </Link>
              .
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <Link key={v.id} href={`/store/${v.slug}`}>
              <Card className="h-full transition hover:border-teal-200 hover:shadow-md">
                <CardContent className="flex gap-4 py-5">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white"
                    style={{ background: v.branding?.primaryColor || "#0F766E" }}
                  >
                    {v.logoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.logoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      v.businessName.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{v.businessName}</h2>
                    <p className="text-xs text-slate-500">{v.category}</p>
                    {v.address?.city && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {v.address.city}
                        {v.address.state ? `, ${v.address.state}` : ""}
                      </p>
                    )}
                    <Badge variant="teal" className="mt-2">
                      <Store className="mr-1 h-3 w-3" />
                      {v.slug}.kurospace.com
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
