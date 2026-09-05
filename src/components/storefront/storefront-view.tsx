"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import type { CatalogItem, Vendor } from "@/types";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { trackAnalyticsEvent } from "@/lib/firebase/analytics";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Mail, MapPin, Phone, Search, ShoppingBag, Store } from "lucide-react";

export function StorefrontView({
  vendor,
  items,
}: {
  vendor: Vendor;
  items: CatalogItem[];
}) {
  const { addItem, count } = useCart();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);
  const location = [vendor.address?.city, vendor.address?.state].filter(Boolean).join(", ");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category?.trim()) set.add(item.category.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const hasProducts = items.some((i) => i.type === "product");
  const hasServices = items.some((i) => i.type === "service");

  const filters = [
    { id: "all", label: "All" },
    ...(hasProducts && hasServices
      ? [
          { id: "product", label: "Products" },
          { id: "service", label: "Services" },
        ]
      : []),
    ...categories.map((c) => ({ id: c, label: c })),
  ];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "product" || filter === "service") {
        if (item.type !== filter) return false;
      } else if (filter !== "all" && item.category !== filter) {
        return false;
      }
      if (!q) return true;
      return [item.name, item.shortDescription, item.description, item.category]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [items, filter, query]);

  const featured = useMemo(
    () => visible.filter((i) => i.featured).slice(0, 4),
    [visible]
  );
  const rest = useMemo(
    () => (featured.length ? visible.filter((i) => !featured.includes(i)) : visible),
    [visible, featured]
  );

  useEffect(() => {
    void trackAnalyticsEvent({
      vendorId: vendor.id,
      type: "page_view",
      path: `/store/${vendor.slug}`,
      dedupeKey: `store_${vendor.id}`,
    });
  }, [vendor.id, vendor.slug]);

  function handleAdd(item: CatalogItem) {
    addItem(item, vendor.id, vendor.slug);
    setAddedId(item.id);
    window.setTimeout(() => setAddedId((id) => (id === item.id ? null : id)), 1600);
    void trackAnalyticsEvent({
      vendorId: vendor.id,
      type: "add_to_cart",
      catalogItemId: item.id,
      path: `/store/${vendor.slug}`,
    });
  }

  return (
    <StorefrontShell vendor={vendor}>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link href={`/store/${vendor.slug}`} className="flex min-w-0 shrink-0 items-center gap-2.5">
            <StoreMark vendor={vendor} className="h-9 w-9" />
            <span className="hidden truncate text-sm font-semibold text-slate-900 sm:inline">
              {vendor.businessName}
            </span>
          </Link>
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this store"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none ring-teal-700/30 placeholder:text-slate-400 focus:border-teal-700 focus:bg-white focus:ring-2"
            />
          </label>
          <Link
            href={`/store/${vendor.slug}/cart`}
            className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
            aria-label={`Cart${count ? `, ${count} items` : ""}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-900 ring-2 ring-white">
                {count}
              </span>
            )}
          </Link>
        </div>
        <nav
          className="border-t border-slate-100 bg-white"
          aria-label="Departments"
        >
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-sm transition ${
                    active
                      ? "bg-teal-700 text-white"
                      : "text-slate-600 hover:bg-teal-50 hover:text-teal-900"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <section className="border-b border-slate-100 bg-gradient-to-b from-teal-50/80 to-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-900">
              {vendor.category}
              {location ? ` · ${location}` : ""}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {vendor.businessName}
            </h1>
            {vendor.description ? (
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
                {vendor.description}
              </p>
            ) : (
              <p className="mt-3 text-base text-slate-600">
                Shop products and services. Pay securely at checkout.
              </p>
            )}
            <a
              href="#catalog"
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-teal-700 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-800"
            >
              Shop now
            </a>
          </div>
          <div className="relative h-44 overflow-hidden rounded-2xl border border-teal-100 bg-teal-700 shadow-sm sm:h-56">
            {vendor.coverURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.coverURL}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-700 to-teal-900">
                <StoreMark vendor={vendor} className="h-20 w-20 ring-4 ring-white/30" />
              </div>
            )}
          </div>
        </div>
      </section>

      <main id="catalog" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <Store className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="font-semibold text-slate-900">
              {items.length === 0 ? "Nothing listed yet" : "No matching items"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {items.length === 0
                ? "This shop hasn’t published products or services."
                : "Try another search or category."}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {featured.length > 0 && filter === "all" && !query ? (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">Featured</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                    Picks
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {featured.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      vendor={vendor}
                      added={addedId === item.id}
                      onAdd={() => handleAdd(item)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  {filter === "all" ? "All products" : filters.find((f) => f.id === filter)?.label}
                </h2>
                <p className="text-sm text-slate-500">
                  {visible.length} {visible.length === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {(featured.length && filter === "all" && !query ? rest : visible).map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    vendor={vendor}
                    added={addedId === item.id}
                    onAdd={() => handleAdd(item)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <StoreMark vendor={vendor} className="h-9 w-9" />
              <p className="font-semibold text-slate-900">{vendor.businessName}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {vendor.description || vendor.category}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {vendor.phone ? (
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-teal-700" />
                  {vendor.phone}
                </li>
              ) : null}
              {vendor.email ? (
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-teal-700" />
                  {vendor.email}
                </li>
              ) : null}
              {location ? (
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-teal-700" />
                  {location}
                </li>
              ) : null}
              {!vendor.phone && !vendor.email && !location ? (
                <li className="text-slate-400">No contact details yet.</li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Shop with confidence</p>
            <p className="mt-3 text-sm text-slate-600">
              Secure checkout with Bachs. Naira pricing. Powered by Kurospace.
            </p>
            <div className="mt-4">
              <BrandLogo className="h-10 w-10" />
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {vendor.businessName} · {vendor.slug}.kurospace.com
        </div>
      </footer>
    </StorefrontShell>
  );
}

function StoreMark({ vendor, className }: { vendor: Vendor; className: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal-700 text-sm font-bold text-white ${className}`}
    >
      {vendor.logoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        vendor.businessName.charAt(0)
      )}
    </div>
  );
}

function ProductCard({
  item,
  vendor,
  added,
  onAdd,
}: {
  item: CatalogItem;
  vendor: Vendor;
  added: boolean;
  onAdd: () => void;
}) {
  const href = `/store/${vendor.slug}/product/${item.id}`;
  const hoverSrc = item.images[1];

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onAdd();
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div className="relative aspect-square bg-slate-50">
        <Link href={href} className="absolute inset-0 block">
          {item.images[0] ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.images[0]}
                alt={item.name}
                className={`h-full w-full object-cover transition duration-300 ${
                  hoverSrc ? "group-hover:opacity-0" : "group-hover:scale-[1.03]"
                }`}
              />
              {hoverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hoverSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-300 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-slate-300">
              <Store className="h-8 w-8" />
            </span>
          )}
        </Link>
        {item.featured ? (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-900">
            Featured
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{item.type}</p>
        <Link href={href} className="mt-0.5 block">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 group-hover:text-teal-800">
            {item.name}
          </h3>
        </Link>
        <p className="mt-auto pt-2 text-sm font-semibold tabular-nums text-teal-800">
          {formatNaira(item.price)}
          {item.compareAtPrice != null && item.compareAtPrice > item.price ? (
            <span className="ml-1.5 text-xs font-normal text-slate-400 line-through">
              {formatNaira(item.compareAtPrice)}
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          className="mt-2 h-9 w-full rounded-lg bg-teal-700 text-xs font-medium text-white transition hover:bg-teal-800"
        >
          {added ? "Added to cart" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
