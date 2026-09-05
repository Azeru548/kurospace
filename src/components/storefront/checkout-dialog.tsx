"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Vendor } from "@/types";
import { formatNaira } from "@/lib/utils";
import { attachBachsCheckout, createOrder } from "@/lib/firebase/orders";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { X } from "lucide-react";


export const BACHS_NGN_MINIMUM = 1000;

type CustomerDraft = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes: string;
};

export function CheckoutDialog({
  vendor,
  open,
  onClose,
}: {
  vendor: Vendor;
  open: boolean;
  onClose: () => void;
}) {
  const { lines, removeItem, total } = useCart();
  const { user, profile, vendor: myVendor, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const autoStarted = useRef(false);

  const saved: CustomerDraft = {
    name: (profile?.displayName || user?.displayName || "").trim(),
    phone: (profile?.phone || myVendor?.phone || "").trim(),
    email: (user?.email || profile?.email || "").trim().toLowerCase(),
    address: myVendor?.address?.street || "",
    city: myVendor?.address?.city || "",
    state: myVendor?.address?.state || vendor.address?.state || "",
    notes: "",
  };

  const canSkipForm = Boolean(user && saved.name && saved.email && saved.phone);

  const [customer, setCustomer] = useState<CustomerDraft>(saved);

  useEffect(() => {
    if (!open) {
      autoStarted.current = false;
      setError("");
      setSubmitting(false);
      return;
    }
    setCustomer(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.uid]);

  useEffect(() => {
    if (!open || authLoading || !canSkipForm || autoStarted.current || !lines.length) return;
    autoStarted.current = true;
    void pay(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, authLoading, canSkipForm, lines.length]);

  if (!open) return null;

  async function pay(info: CustomerDraft) {
    if (!lines.length) return;

    const name = info.name.trim();
    const email = info.email.trim();
    const phone = info.phone.trim();

    if (!name || !phone) {
      setError("Name and phone are required.");
      return;
    }
    if (!email) {
      setError("Email is required to pay securely with Bachs.");
      return;
    }
    if (total < BACHS_NGN_MINIMUM) {
      setError(
        `Minimum order for online payment is ₦${BACHS_NGN_MINIMUM.toLocaleString()}.`
      );
      return;
    }

    const stockIssue = lines.find(
      (l) => l.item.trackInventory && l.item.stock != null && l.quantity > l.item.stock
    );
    if (stockIssue) {
      setError(`${stockIssue.item.name} only has ${stockIssue.item.stock} in stock.`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const order = await createOrder({
        vendorId: vendor.id,
        vendorSlug: vendor.slug,
        items: lines.map((l) => ({
          catalogItemId: l.item.id,
          type: l.item.type,
          name: l.item.name,
          price: l.item.price,
          quantity: l.quantity,
          imageURL: l.item.images[0],
        })),
        customer: {
          name,
          phone,
          email,
          ...(info.address.trim() ? { address: info.address.trim() } : {}),
          ...(info.city.trim() ? { city: info.city.trim() } : {}),
          ...(info.state.trim() ? { state: info.state.trim() } : {}),
          ...(info.notes.trim() ? { notes: info.notes.trim() } : {}),
        },
        paymentMethod: "bachs",
        paymentStatus: "pending",
        source: "storefront",
      });

      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          vendorId: vendor.id,
          vendorSlug: vendor.slug,
          amountNgn: order.total,
          customer: { name, email, phone },
        }),
      });

      const data = (await res.json()) as {
        checkoutUrl?: string;
        checkoutId?: string;
        error?: string;
      };

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(
          data.error ||
            "Could not start Bachs checkout. Check BACHS_API_KEY on the server."
        );
      }

      try {
        if (data.checkoutId) await attachBachsCheckout(order.id, data.checkoutId);
      } catch {
        /* rules may block if already written */
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
      setSubmitting(false);
    }
  }

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    await pay(customer);
  }

  const skipUi = Boolean(user) && (authLoading || canSkipForm) && !error;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Checkout · {vendor.businessName}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-slate-500">Your cart is empty.</p>
        ) : skipUi ? (
          <div className="space-y-4">
            <ul className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
              {lines.map((l) => (
                <li key={l.item.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {l.item.name} × {l.quantity}
                  </span>
                  <span className="font-medium text-teal-800">
                    {formatNaira(l.item.price * l.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-right text-base font-bold">
              Total{" "}
              <span className="text-teal-800">{formatNaira(total)}</span>
            </p>
            <p className="text-sm text-slate-600">
              Paying as <span className="font-medium text-slate-900">{saved.name}</span>
              {saved.email ? ` · ${saved.email}` : ""}
            </p>
            {submitting || authLoading ? (
              <p className="text-center text-sm text-slate-500">Taking you to secure payment…</p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              loading={submitting || authLoading}
              onClick={() => void pay(saved)}
            >
              Pay {formatNaira(total)}
            </Button>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="space-y-4">
            <ul className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
              {lines.map((l) => (
                <li key={l.item.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-slate-800">
                    {l.item.name} × {l.quantity}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-medium text-teal-800">
                      {formatNaira(l.item.price * l.quantity)}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-slate-400 transition hover:text-red-600"
                      onClick={() => removeItem(l.item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-right text-base font-bold text-slate-900">
              Total <span className="text-teal-800">{formatNaira(total)}</span>
            </p>
            <Input
              label="Your name"
              required
              value={customer.name}
              onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
            />
            <Input
              label="Phone"
              required
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              required
              value={customer.email}
              onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              hint="Required for Bachs checkout receipt and confirmation."
            />
            <Input
              label="Address"
              value={customer.address}
              onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                value={customer.city}
                onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))}
              />
              <Input
                label="State"
                value={customer.state}
                onChange={(e) => setCustomer((c) => ({ ...c, state: e.target.value }))}
              />
            </div>
            <Textarea
              label="Notes"
              value={customer.notes}
              onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
              placeholder="Size, colour, preferred time…"
            />
            <p className="text-xs text-slate-500">
              You&apos;ll pay securely on Bachs (cards, bank transfer, mobile money). Kurospace
              is the merchant for v1 — one-time product/service orders only.
            </p>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              loading={submitting}
            >
              Pay with Bachs
            </Button>
          </form>
        )}

        {error && skipUi ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
