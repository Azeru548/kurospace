"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { listCatalogItems } from "@/lib/firebase/catalog";
import { listVendorOrders } from "@/lib/firebase/orders";
import { formatNaira } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Briefcase,
  ShoppingBag,
  Eye,
  ArrowRight,
  Globe,
} from "lucide-react";
import type { Order } from "@/types";

export default function DashboardHomePage() {
  const { vendor } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ products: 0, services: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendor) return;
    let cancelled = false;
    (async () => {
      try {
        const [items, ords] = await Promise.all([
          listCatalogItems(vendor.id),
          listVendorOrders(vendor.id),
        ]);
        if (cancelled) return;
        setCounts({
          products: items.filter((i) => i.type === "product").length,
          services: items.filter((i) => i.type === "service").length,
        });
        setOrders(ords.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendor]);

  if (!vendor) return null;

  const stats = [
    {
      label: "Products",
      value: counts.products,
      icon: Package,
      href: "/dashboard/products",
    },
    {
      label: "Services",
      value: counts.services,
      icon: Briefcase,
      href: "/dashboard/services",
    },
    {
      label: "Orders",
      value: vendor.stats?.orderCount ?? orders.length,
      icon: ShoppingBag,
      href: "/dashboard/orders",
    },
    {
      label: "Store views",
      value: vendor.stats?.viewCount ?? 0,
      icon: Eye,
      href: "/dashboard/analytics",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {vendor.businessName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage catalog, orders, and your branded storefront.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!vendor.isPublished && (
            <Link href="/dashboard/settings">
              <Button variant="secondary" size="sm">
                Publish your store
              </Button>
            </Link>
          )}
          <Link href="/dashboard/storefront">
            <Button size="sm" variant="outline">
              <Globe className="h-4 w-4" />
              Customise site
            </Button>
          </Link>
        </div>
      </div>

      {!vendor.isPublished && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your storefront is in draft. Publish it from Settings so customers can order on{" "}
          <strong>{vendor.slug}.kurospace.com</strong>.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition hover:border-teal-200 hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {loading ? "—" : s.value}
                    </p>
                    <p className="text-sm text-slate-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link
              href="/dashboard/orders"
              className="text-xs font-medium text-teal-800 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : orders.length === 0 ? (
              <div className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No orders yet. Share your storefront link to get your first sale.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{o.orderNumber}</p>
                      <p className="text-xs text-slate-500">{o.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatNaira(o.total)}</p>
                      <Badge
                        variant={
                          o.status === "pending"
                            ? "warning"
                            : o.status === "completed"
                              ? "success"
                              : "default"
                        }
                      >
                        {o.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/dashboard/products", label: "Add a product" },
              { href: "/dashboard/services", label: "Add a service" },
              { href: "/dashboard/storefront", label: "Edit storefront branding" },
              { href: "/dashboard/settings", label: "Business settings" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 text-sm font-medium text-slate-800 hover:border-teal-200 hover:bg-teal-50/50"
              >
                {a.label}
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
