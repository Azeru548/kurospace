"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { listVendorOrders, updateOrderStatus } from "@/lib/firebase/orders";
import { formatNaira, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

export default function OrdersPage() {
  const { vendor } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  async function load() {
    if (!vendor) return;
    setLoading(true);
    try {
      setOrders(await listVendorOrders(vendor.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.id]);

  async function changeStatus(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    await load();
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status } : s));
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Orders from your storefront and marketplace. Email alerts will plug into your custom provider next.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No orders yet. When a customer places an order, it appears here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Order</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Total</th>
                    <th className="pb-3 pr-4 font-medium">Payment</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="align-top">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{o.orderNumber}</p>
                        <p className="text-xs text-slate-500">
                          {o.createdAt ? formatDate(o.createdAt as Date) : "—"}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p>{o.customer.name}</p>
                        <p className="text-xs text-slate-500">{o.customer.phone}</p>
                      </td>
                      <td className="py-3 pr-4 font-medium">{formatNaira(o.total)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={o.paymentStatus === "paid" ? "success" : "warning"}>
                          {o.paymentStatus}
                        </Badge>
                        <p className="mt-0.5 text-xs text-slate-500">{o.paymentMethod}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Select
                          value={o.status}
                          onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                          options={statusOptions}
                          className="min-w-[130px]"
                        />
                      </td>
                      <td className="py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selected.orderNumber}</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Customer</p>
                <p className="font-medium">{selected.customer.name}</p>
                <p>{selected.customer.phone}</p>
                {selected.customer.email && <p>{selected.customer.email}</p>}
                {selected.customer.address && (
                  <p className="text-slate-600">
                    {selected.customer.address}
                    {selected.customer.city ? `, ${selected.customer.city}` : ""}
                    {selected.customer.state ? `, ${selected.customer.state}` : ""}
                  </p>
                )}
                {selected.customer.notes && (
                  <p className="mt-1 text-slate-600">Note: {selected.customer.notes}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Items</p>
                <ul className="mt-1 divide-y divide-slate-100">
                  {selected.items.map((item, i) => (
                    <li key={i} className="flex justify-between py-2">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatNaira(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right font-semibold">
                  Total {formatNaira(selected.total)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
