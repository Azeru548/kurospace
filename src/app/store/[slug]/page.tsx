"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { listCatalogItems } from "@/lib/firebase/catalog";
import { StorefrontView } from "@/components/storefront/storefront-view";
import type { CatalogItem, Vendor } from "@/types";
import Link from "next/link";
import { Store, AlertTriangle } from "lucide-react";
import { PageLoader } from "@/components/brand/brand-logo";

export default function StoreBySlugPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const v = await getVendorBySlug(slug);
        if (cancelled) return;
        if (!v) {
          setVendor(null);
          setItems([]);
          setError("Store not found.");
          return;
        }
        const catalog = await listCatalogItems(v.id, { status: "active" });
        if (cancelled) return;
        setVendor(v);
        setItems(catalog);
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        setVendor(null);
        setItems([]);
        setError("Could not load store. Check Firebase configuration.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <PageLoader />;
  }

  if (error || !vendor) {
    return (
      <StatusScreen
        icon={<AlertTriangle className="h-6 w-6" strokeWidth={1.75} />}
        title={error || "Store not found"}
        description="The store you're looking for doesn't exist or may have been moved."
        action={{ href: "/marketplace", label: "Back to marketplace" }}
      />
    );
  }

  if (!vendor.isPublished) {
    return (
      <StatusScreen
        icon={<Store className="h-6 w-6" strokeWidth={1.75} />}
        title="This store isn't live yet"
        description="The owner is still setting things up. Check back soon."
        action={{ href: "/", label: "Go to Kurospace" }}
      />
    );
  }

  return <StorefrontView vendor={vendor} items={items} />;
}

function StatusScreen({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-semibold tracking-tight text-slate-900">{title}</p>
          <p className="text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
        <Link
          href={action.href}
          className="mt-2 inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          {action.label}
        </Link>
      </div>
    </div>
  );
}
