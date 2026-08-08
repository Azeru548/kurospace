"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { XCircle } from "lucide-react";
import type { Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

function CancelledContent() {
  const params = useParams();
  const search = useSearchParams();
  const slug = String(params.slug || "");
  const orderId = search.get("order_id");
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const v = await getVendorBySlug(slug);
        setVendor(v);
      } catch {
        /* best-effort branding */
      }
    })();
  }, [slug]);

  const branding = vendor ? { ...DEFAULT_BRANDING, ...vendor.branding } : DEFAULT_BRANDING;

  return (
    <StorefrontShell
      vendor={
        vendor ?? {
          id: "",
          ownerId: "",
          slug,
          businessName: "Store",
          category: "Store",
          branding,
          plan: "free",
          storefrontEnabled: true,
          isPublished: true,
          createdAt: null,
          updatedAt: null,
        }
      }
    >
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="store-card w-full max-w-md bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <XCircle className="h-8 w-8" />
          </div>
          <h1 className="store-heading text-xl">Payment cancelled</h1>
          <p className="store-muted mt-2 text-sm">
            You left Bachs checkout without paying. Your cart order is saved as unpaid — you can try
            again from the store.
          </p>
          {orderId && (
            <p className="store-muted mt-3 text-xs opacity-60">Order ref: {orderId}</p>
          )}
          <Link
            href={`/store/${slug}`}
            className="store-btn-primary mt-6 inline-block rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: branding.primaryColor }}
          >
            Return to store
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}

export default function OrderCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <CancelledContent />
    </Suspense>
  );
}
