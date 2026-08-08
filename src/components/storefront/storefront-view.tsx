"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { CatalogItem, Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";
import { formatNaira } from "@/lib/utils";
import { attachBachsCheckout, createOrder } from "@/lib/firebase/orders";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, X } from "lucide-react";

const BACHS_NGN_MINIMUM = 1000;

interface CartLine {
  item: CatalogItem;
  quantity: number;
}

export function StorefrontView({
  vendor,
  items,
}: {
  vendor: Vendor;
  items: CatalogItem[];
}) {
  const branding = { ...DEFAULT_BRANDING, ...vendor.branding };
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: vendor.address?.state ?? "",
    notes: "",
  });

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.item.price * l.quantity, 0),
    [cart]
  );

  function addToCart(item: CatalogItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((l) => l.item.id !== id));
  }

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (!cart.length) return;

    const name = customer.name.trim();
    const email = customer.email.trim();
    const phone = customer.phone.trim();

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

    setSubmitting(true);
    setError("");
    try {
      // 1) Create order in Firestore (pending payment)
      const order = await createOrder({
        vendorId: vendor.id,
        vendorSlug: vendor.slug,
        items: cart.map((l) => ({
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
          address: customer.address.trim() || undefined,
          city: customer.city.trim() || undefined,
          state: customer.state.trim() || undefined,
          notes: customer.notes.trim() || undefined,
        },
        paymentMethod: "bachs",
        paymentStatus: "pending",
        source: "storefront",
      });

      // 2) Create Bachs hosted checkout (platform merchant)
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

      // Best-effort: store checkout id from the client if Admin isn't configured yet
      try {
        if (data.checkoutId) await attachBachsCheckout(order.id, data.checkoutId);
      } catch {
        /* rules may block if already written */
      }

      // 3) Hosted redirect — most reliable in production (no popup blockers)
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
      setSubmitting(false);
    }
  }

  const gridClass =
    branding.layout === "list"
      ? "space-y-4"
      : branding.layout === "showcase"
        ? "grid grid-cols-1 gap-5 sm:grid-cols-2"
        : "grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div
      className="min-h-screen"
      style={{
        background: branding.backgroundColor,
        color: branding.textColor,
        fontFamily: branding.fontFamily,
      }}
    >
      {branding.showCover && (
        <div
          className="h-40 sm:h-56"
          style={{
            background: vendor.coverURL
              ? `center/cover url(${vendor.coverURL})`
              : `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
          }}
        />
      )}

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          {branding.showLogo && (
            <div
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white shadow-sm sm:h-16 sm:w-16"
              style={{ background: branding.primaryColor }}
            >
              {vendor.logoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                vendor.businessName.charAt(0)
              )}
            </div>
          )}
          <div>
            <h1
              className="text-xl font-bold sm:text-2xl"
              style={{ fontFamily: branding.headingFont || branding.fontFamily }}
            >
              {vendor.businessName}
            </h1>
            <p className="text-sm opacity-70">{vendor.category}</p>
            {(vendor.address?.city || vendor.address?.state) && (
              <p className="mt-0.5 text-xs opacity-50">
                {[vendor.address?.city, vendor.address?.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCheckoutOpen(true)}
          className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white"
          style={{ background: branding.primaryColor }}
        >
          <ShoppingBag className="h-4 w-4" />
          Cart
          {cart.length > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: branding.accentColor, color: "#0f172a" }}
            >
              {cart.reduce((s, l) => s + l.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {vendor.description && (
          <p className="mb-8 max-w-2xl text-sm opacity-80 sm:text-base">{vendor.description}</p>
        )}

        {items.length === 0 ? (
          <p className="text-sm opacity-60">This shop has no active listings yet.</p>
        ) : (
          <div className={gridClass}>
            {items.map((item) => {
              const desc = item.shortDescription || item.description;
              const isList = branding.layout === "list";

              return (
                <article
                  key={item.id}
                  className={
                    isList
                      ? "flex gap-4 overflow-hidden rounded-xl border p-3 sm:p-4"
                      : "group flex flex-col overflow-hidden rounded-xl border transition hover:shadow-md"
                  }
                  style={{ borderColor: `${branding.primaryColor}22` }}
                >
                  {/* Shopify-style portrait media (taller than wide) */}
                  <div
                    className={
                      isList
                        ? "h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-black/5 sm:h-32 sm:w-32"
                        : "relative aspect-[3/4] w-full overflow-hidden bg-black/5"
                    }
                  >
                    {item.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : null}
                    {!isList && (
                      <Badge
                        variant="default"
                        className="absolute left-2 top-2 bg-white/95 capitalize shadow-sm"
                      >
                        {item.type}
                      </Badge>
                    )}
                  </div>

                  <div
                    className={
                      isList
                        ? "flex min-w-0 flex-1 flex-col justify-between py-0.5"
                        : "flex flex-1 flex-col gap-1.5 p-3 sm:p-4"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px]">
                        {item.name}
                      </h2>
                      {isList && (
                        <Badge variant="default" className="shrink-0 capitalize">
                          {item.type}
                        </Badge>
                      )}
                    </div>
                    {desc && (
                      <p className="line-clamp-2 text-xs opacity-70 sm:line-clamp-3">{desc}</p>
                    )}
                    <div
                      className={
                        isList
                          ? "mt-2 flex items-center justify-between gap-2"
                          : "mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between"
                      }
                    >
                      <div>
                        <p
                          className="text-sm font-semibold sm:text-base"
                          style={{ color: branding.primaryColor }}
                        >
                          {formatNaira(item.price)}
                        </p>
                        {item.compareAtPrice != null && item.compareAtPrice > item.price && (
                          <p className="text-xs opacity-50 line-through">
                            {formatNaira(item.compareAtPrice)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-white sm:text-sm"
                        style={{ background: branding.primaryColor }}
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-12 text-center text-xs opacity-40">
          Powered by Kurospace · {vendor.slug}.kurospace.com
        </p>
      </main>

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-5 shadow-xl"
            style={{ background: branding.backgroundColor, color: branding.textColor }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Checkout</h3>
              <button type="button" onClick={() => setCheckoutOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-sm opacity-70">Your cart is empty.</p>
            ) : (
              <form onSubmit={placeOrder} className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {cart.map((l) => (
                    <li key={l.item.id} className="flex items-center justify-between gap-2">
                      <span>
                        {l.item.name} × {l.quantity}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{formatNaira(l.item.price * l.quantity)}</span>
                        <button
                          type="button"
                          className="text-xs opacity-60 hover:opacity-100"
                          onClick={() => removeFromCart(l.item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-right font-semibold">Total {formatNaira(total)}</p>
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
                <p className="text-xs opacity-60">
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
                  style={{ background: branding.primaryColor }}
                >
                  Pay with Bachs
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
