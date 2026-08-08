"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getOrder } from "@/lib/firebase/orders";
import { getVendorBySlug } from "@/lib/firebase/vendors";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { CheckCircle2, Mail, MapPin, Phone, Store } from "lucide-react";
import type { CustomerInfo, OrderItem, Vendor } from "@/types";

function SuccessContent() {
  const params = useParams();
  const search = useSearchParams();
  const { clear } = useCart();
  const slug = String(params.slug || "");
  const orderId = search.get("order_id") || "";
  const checkoutId = search.get("checkout_id") || "";
  const initialStatus = orderId ? "loading" : "missing";
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "missing">(
    initialStatus
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const v = await getVendorBySlug(slug);
        setVendor(v);
      } catch {
        /* vendor contact is best-effort */
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let tries = 0;

    async function poll() {
      try {
        const order = await getOrder(orderId);
        if (cancelled) return;
        if (!order) {
          setStatus("missing");
          return;
        }
        setOrderNumber(order.orderNumber);
        setTotal(order.total);
        setItems(order.items ?? []);
        setCustomer(order.customer ?? null);
        if (order.paymentStatus === "paid") {
          clear();
          setStatus("paid");
          return;
        }
        // Webhook may lag a few seconds
        tries += 1;
        if (tries < 8) {
          setStatus("pending");
          setTimeout(poll, 1500);
        } else {
          setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("pending");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId, clear]);

  const contact = [
    { icon: Phone, label: vendor?.phone },
    { icon: Mail, label: vendor?.email },
    { icon: MapPin, label: vendor?.whatsapp },
  ].filter((c) => c.label);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {status === "paid" ? "Payment successful" : "Order received"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {status === "paid"
              ? "Bachs confirmed your payment. The vendor has been notified."
              : status === "pending"
                ? "You completed checkout. We’re confirming payment with Bachs — this usually takes a few seconds. The vendor will see the order either way."
                : status === "loading"
                  ? "Confirming your order…"
                  : "Thanks for your order. If you paid, confirmation may take a moment."}
          </p>
          {orderNumber && (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
              {orderNumber}
              {total != null ? ` · ${formatNaira(total)}` : ""}
            </p>
          )}
          {checkoutId && (
            <p className="mt-2 text-xs text-slate-400">Checkout: {checkoutId}</p>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {items.map((it) => (
                <li key={it.catalogItemId} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {it.imageURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.imageURL}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Store className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{it.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{it.type} · ×{it.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatNaira(it.price * it.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{total != null ? formatNaira(total) : "—"}</span>
            </div>
          </div>
        )}

        {customer && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Delivery details</h2>
              <p className="mt-3 text-sm font-medium text-slate-900">{customer.name}</p>
              {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
              {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
              {(customer.address || customer.city || customer.state) && (
                <p className="mt-2 text-sm text-slate-600">
                  {[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}
                </p>
              )}
              {customer.notes && (
                <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                  Notes: {customer.notes}
                </p>
              )}
            </div>

            {vendor && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Vendor contact</h2>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-teal-700 text-sm font-bold text-white">
                    {vendor.logoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      vendor.businessName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{vendor.businessName}</p>
                    <p className="text-xs text-slate-500">{vendor.category}</p>
                  </div>
                </div>
                {[vendor.address?.street, vendor.address?.city, vendor.address?.state]
                  .filter(Boolean)
                  .length > 0 && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {[vendor.address?.street, vendor.address?.city, vendor.address?.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {contact.map((c) => (
                  <p key={c.label} className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                    <c.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-all">{c.label}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <Link
            href={`/store/${slug}`}
            className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-teal-800 sm:w-auto"
          >
            Back to store
          </Link>
          <Link href="/marketplace" className="text-sm text-teal-800 hover:underline">
            Browse marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
