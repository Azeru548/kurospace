"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, Package, ShoppingBag } from "lucide-react";

export default function AnalyticsPage() {
  const { vendor } = useAuth();
  if (!vendor) return null;

  const cards = [
    {
      label: "Store views",
      value: vendor.stats?.viewCount ?? 0,
      icon: Eye,
      note: "Event tracking foundation ready",
    },
    {
      label: "Orders",
      value: vendor.stats?.orderCount ?? 0,
      icon: ShoppingBag,
      note: "Lifetime from orders collection",
    },
    {
      label: "Products",
      value: vendor.stats?.productCount ?? 0,
      icon: Package,
      note: "Active catalog size",
    },
    {
      label: "Services",
      value: vendor.stats?.serviceCount ?? 0,
      icon: BarChart3,
      note: "Service listings",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          High-level performance for {vendor.businessName}. Charts and date ranges come next.
        </p>
      </div>

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
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-sm text-slate-500">{c.label}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">{c.note}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Page views over time, top products, conversion, and traffic sources. Events are modeled
            in Firestore (<code className="text-xs">analyticsEvents</code>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Charts will render here once we wire storefront page_view events.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
