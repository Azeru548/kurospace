"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { listAnalyticsEvents } from "@/lib/firebase/analytics";
import { listVendorOrders } from "@/lib/firebase/orders";
import { listCatalogItems } from "@/lib/firebase/catalog";
import { formatNaira } from "@/lib/utils";
import type { AnalyticsEvent, Order } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, Package, ShoppingBag } from "lucide-react";
import { InlineLoader } from "@/components/brand/brand-logo";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

function eventDate(ev: AnalyticsEvent): Date | null {
  const raw = ev.createdAt;
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && "toDate" in raw) return raw.toDate();
  return null;
}

export default function AnalyticsPage() {
  const { vendor } = useAuth();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalogCounts, setCatalogCounts] = useState({ products: 0, services: 0 });
  const [loading, setLoading] = useState(true);
  const [indexHint, setIndexHint] = useState("");

  useEffect(() => {
    if (!vendor) return;
    let cancelled = false;
    (async () => {
      try {
        const [ev, ords, catalog] = await Promise.all([
          listAnalyticsEvents(vendor.id).catch((e) => {
            console.error(e);
            setIndexHint(
              "If this is the first load, publish firestore.indexes.json (analyticsEvents vendorId + createdAt)."
            );
            return [] as AnalyticsEvent[];
          }),
          listVendorOrders(vendor.id),
          listCatalogItems(vendor.id),
        ]);
        if (cancelled) return;
        setEvents(ev);
        setOrders(ords);
        setCatalogCounts({
          products: catalog.filter((i) => i.type === "product").length,
          services: catalog.filter((i) => i.type === "service").length,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendor]);

  const days = useMemo(() => lastNDays(7), []);
  const viewsByDay = useMemo(() => {
    const map = Object.fromEntries(days.map((d) => [d, 0])) as Record<string, number>;
    for (const ev of events) {
      if (ev.type !== "page_view" && ev.type !== "product_view" && ev.type !== "service_view") {
        continue;
      }
      const dt = eventDate(ev);
      if (!dt) continue;
      const k = dayKey(dt);
      if (k in map) map[k] += 1;
    }
    return days.map((d) => ({ day: d, count: map[d] ?? 0 }));
  }, [events, days]);

  const maxViews = Math.max(1, ...viewsByDay.map((d) => d.count));
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const revenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
  const addToCarts = events.filter((e) => e.type === "add_to_cart").length;
  const productViews = events.filter((e) => e.type === "product_view" || e.type === "service_view").length;

  if (!vendor) return null;

  const cards = [
    {
      label: "Store views",
      value: vendor.stats?.viewCount ?? events.filter((e) => e.type === "page_view").length,
      icon: Eye,
    },
    {
      label: "Paid orders",
      value: paidOrders.length,
      icon: ShoppingBag,
    },
    {
      label: "Revenue (paid)",
      value: formatNaira(revenue),
      icon: BarChart3,
    },
    {
      label: "Catalog",
      value: `${catalogCounts.products} / ${catalogCounts.services}`,
      icon: Package,
      note: "Products / services",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Live counts for {vendor.businessName} from storefront visits and orders.
        </p>
      </div>

      {loading ? (
        <InlineLoader />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.label}>
                  <CardContent className="py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                        <p className="text-sm text-slate-500">{c.label}</p>
                      </div>
                    </div>
                    {"note" in c && c.note ? (
                      <p className="mt-3 text-xs text-slate-400">{c.note}</p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Views · last 7 days</CardTitle>
              <CardDescription>
                Store, product, and service page views. {addToCarts} add-to-cart
                {productViews ? ` · ${productViews} listing views` : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indexHint ? <p className="mb-3 text-xs text-amber-800">{indexHint}</p> : null}
              <div className="flex h-48 items-end gap-2">
                {viewsByDay.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-teal-700/80"
                      style={{ height: `${Math.max(6, (d.count / maxViews) * 100)}%` }}
                      title={`${d.count} views`}
                    />
                    <span className="text-[10px] text-slate-500">
                      {d.day.slice(5).replace("-", "/")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
