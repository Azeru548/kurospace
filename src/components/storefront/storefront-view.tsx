"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import type { CatalogItem, Vendor } from "@/types";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { MapPin, ShoppingBag, Store } from "lucide-react";

export function StorefrontView({
  vendor,
  items,
}: {
  vendor: Vendor;
  items: CatalogItem[];
}) {
  const { addItem, count } = useCart();
  const [filter, setFilter] = useState("all");
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

  const sorted = useMemo(
    () => [...items].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))),
    [items]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    if (filter === "product" || filter === "service") {
      return sorted.filter((i) => i.type === filter);
    }
    return sorted.filter((i) => i.category === filter);
  }, [sorted, filter]);

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
  const showFilters = filters.length > 1;

  function handleAdd(item: CatalogItem) {
    addItem(item, vendor.id, vendor.slug);
    setAddedId(item.id);
    window.setTimeout(() => setAddedId((id) => (id === item.id ? null : id)), 1600);
  }

  return (
    <StorefrontShell vendor={vendor}>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={`/store/${vendor.slug}`} className="flex min-w-0 items-center gap-2.5">
            <StoreMark vendor={vendor} className="h-8 w-8" />
            <span className="truncate text-sm font-semibold text-slate-900">
              {vendor.businessName}
            </span>
          </Link>
          <Link
            href={`/store/${vendor.slug}/cart`}
            className="relative inline-flex h-9 items-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800"
            aria-label={`Cart${count ? `, ${count} items` : ""}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-900">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <section className="relative h-36 w-full overflow-hidden sm:h-44">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: vendor.coverURL
              ? `url(${vendor.coverURL})`
              : "linear-gradient(135deg, #0F766E, #134E4A)",
          }}
          role="img"
          aria-label={`${vendor.businessName} cover`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-6xl items-end gap-3 px-4 pb-3 sm:gap-4 sm:px-6 sm:pb-4">
          <StoreMark vendor={vendor} className="h-12 w-12 ring-2 ring-white sm:h-14 sm:w-14" />
          <div className="min-w-0 pb-0.5 text-white">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {vendor.businessName}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/80 sm:text-sm">
              <span>{vendor.category}</span>
              {location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {vendor.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            {vendor.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">
            {filter === "all" ? "Shop" : filters.find((f) => f.id === filter)?.label}
            <span className="ml-2 font-normal text-slate-500">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </span>
          </p>
          {showFilters ? (
            <nav className="-mx-1 flex gap-1 overflow-x-auto" aria-label="Collections">
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
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Store className="mb-3 h-8 w-8 text-slate-300" />
            <p className="font-semibold text-slate-900">
              {items.length === 0 ? "Nothing listed yet" : "Nothing in this collection"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {items.length === 0
                ? "This shop hasn’t published products or services."
                : "Try another collection."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                vendor={vendor}
                added={addedId === item.id}
                onAdd={() => handleAdd(item)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 py-6">
        <p className="text-center text-xs text-slate-500">
          {vendor.businessName} · {vendor.slug}.kurospace.com
        </p>
      </footer>
    </StorefrontShell>
  );
}

function StoreMark({
  vendor,
  className,
}: {
  vendor: Vendor;
  className: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-700 text-sm font-bold text-white ${className}`}
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
    <article className="group">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
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
              <Store className="h-7 w-7" />
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={handleAdd}
          className="absolute bottom-2 right-2 z-10 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-900 shadow-sm backdrop-blur-sm transition hover:bg-teal-700 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
        >
          {added ? "Added" : "Add"}
        </button>
      </div>
      <Link href={href} className="mt-2 block">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">{item.name}</h3>
      </Link>
      <p className="mt-0.5 text-sm tabular-nums text-teal-800">
        {formatNaira(item.price)}
        {item.compareAtPrice != null && item.compareAtPrice > item.price ? (
          <span className="ml-1.5 text-xs text-slate-400 line-through">
            {formatNaira(item.compareAtPrice)}
          </span>
        ) : null}
      </p>
    </article>
  );
}
