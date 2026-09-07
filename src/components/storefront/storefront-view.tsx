"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import type { CatalogItem, Vendor } from "@/types";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { trackAnalyticsEvent } from "@/lib/firebase/analytics";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  ArrowUpRight,
  Heart,
  Mail,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from "lucide-react";

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
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [heroInView, setHeroInView] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    void trackAnalyticsEvent({
      vendorId: vendor.id,
      type: "page_view",
      path: `/store/${vendor.slug}`,
      dedupeKey: `store_${vendor.id}`,
    });
  }, [vendor.id, vendor.slug]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setHeroInView(e.isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  function toggleWishlist(id: string) {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // bento span helper — hero is wide, others breathe
  function bentoSpan(idx: number) {
    if (visible.length <= 3) return "sm:col-span-3 lg:col-span-4";
    if (idx === 0) return "col-span-2 sm:col-span-6 lg:col-span-6";
    if (idx === 5) return "sm:col-span-3 lg:col-span-6";
    if (idx % 7 === 0 && idx !== 0) return "sm:col-span-3 lg:col-span-6";
    return "sm:col-span-3 lg:col-span-3";
  }

  return (
    <StorefrontShell vendor={vendor}>
      {/* header — frosted, teal + orange */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link href={`/store/${vendor.slug}`} className="flex min-w-0 shrink-0 items-center gap-2.5">
            <StoreMark vendor={vendor} size={36} />
            <span className="hidden max-w-[180px] truncate text-[15px] font-semibold tracking-tight text-slate-900 sm:inline">
              {vendor.businessName}
            </span>
          </Link>

          <label className="group relative min-w-0 flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-teal-700" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, services…"
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/80 pl-10 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>

          <Link
            href={`/store/${vendor.slug}/cart`}
            className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
            aria-label={`Cart${count ? `, ${count} items` : ""}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Bag</span>
            {count > 0 && (
              <span
                key={count}
                className="bento-pop absolute -right-1 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white ring-2 ring-white"
              >
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* filter bar — pill underline with orange active */}
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="mr-1 hidden shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Browse
            </span>
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  {f.label}
                  {active ? <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-500" /> : null}
                </button>
              );
            })}
            {(filter !== "all" || query) && (
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="ml-2 shrink-0 text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO — cover as background */}
      <section
        ref={heroRef}
        className="relative isolate overflow-hidden"
      >
        {/* bg image */}
        <div className="absolute inset-0">
          {vendor.coverURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.coverURL}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900" />
          )}
          {/* warm teal→orange mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 via-transparent to-orange-500/25" />
          {/* subtle grain vignette */}
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: `22px 22px` }} />
        </div>

        {/* content */}
        <div className="relative mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:flex-row lg:items-end lg:justify-between lg:py-16">
          <div
            className={`max-w-2xl transition duration-700 ${heroInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-xl ring-1 ring-white/20 sm:h-20 sm:w-20">
                <StoreMark vendor={vendor} size={72} rounded="rounded-xl" />
              </div>
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur">
                {vendor.category} {location ? `• ${location}` : ""}
              </div>
            </div>

            <h1 className="mt-5 text-3xl font-bold leading-none tracking-tight text-white sm:text-5xl">
              {vendor.businessName}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              {vendor.description || "Curated products and services. Secure checkout, fast support. Pay with Bachs in Naira."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#catalog"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 hover:shadow-orange-500/30 active:scale-[0.98]"
              >
                Shop collection <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href={`#contact`}
                className="inline-flex h-11 items-center rounded-full bg-white/10 px-6 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
              >
                Contact store
              </a>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-50 ring-1 ring-teal-400/20">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {items.length} items • open
              </span>
            </div>
          </div>

          {/* bento stats card — floats over hero */}
          <div
            className={`hidden w-full max-w-sm shrink-0 lg:block transition duration-700 delay-150 ${heroInView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
          >
            <div className="rounded-[1.5rem] bg-white p-5 shadow-2xl ring-1 ring-slate-200/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Today&apos;s picks</p>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                  {visible.length} live
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{items.filter((i) => i.type === "product").length}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Products</p>
                </div>
                <div className="rounded-2xl bg-teal-50 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-teal-800">{items.filter((i) => i.featured).length}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-teal-600">Featured</p>
                </div>
                <div className="rounded-2xl bg-orange-50 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-orange-700">{categories.length}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-orange-600">Categories</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-teal-600" /> {location || "Nigeria"} • Secure Bachs checkout
              </div>
            </div>
          </div>
        </div>

        {/* bottom fade into canvas */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--bento-canvas)] to-transparent" />
      </section>

      {/* CATALOG — bento canvas */}
      <main id="catalog" className="mx-auto w-full max-w-[1280px] flex-1 bg-[var(--bento-canvas)] px-4 py-8 sm:px-6 sm:py-10">
        {visible.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
            <Store className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="font-semibold text-slate-900">
              {items.length === 0 ? "Nothing listed yet" : "No matching items"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {items.length === 0
                ? "This shop hasn’t published products or services."
                : "Try another search or category."}
            </p>
            {(filter !== "all" || query) && (
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {filter === "all" ? "Collection" : filters.find((f) => f.id === filter)?.label}
                <span className="ml-2 align-middle text-sm font-normal text-slate-500">— {visible.length} pieces</span>
              </h2>
              <p className="hidden text-xs font-medium uppercase tracking-widest text-slate-400 sm:block">Bento • curated</p>
            </div>

            {/* bento grid — auto rows let sale price stay visible */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-6 lg:grid-cols-12">
              {visible.map((item, idx) => (
                <div
                  key={item.id}
                  className={`bento-reveal flex ${bentoSpan(idx)}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <BentoCard
                    item={item}
                    vendor={vendor}
                    added={addedId === item.id}
                    wished={wishlist.has(item.id)}
                    onAdd={() => handleAdd(item)}
                    onWishlist={() => toggleWishlist(item.id)}
                    featured={idx === 0 && !query && filter === "all"}
                  />
                </div>
              ))}

              {/* bento utility tiles — orange + teal */}
              <div className="bento-reveal sm:col-span-3 lg:col-span-4" style={{ animationDelay: `${visible.length * 60}ms` }}>
                <div className="flex h-full flex-col justify-between rounded-[1.25rem] bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
                  <div>
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">Need help?</p>
                    <h3 className="mt-3 text-xl font-bold leading-tight">Chat with {vendor.businessName}</h3>
                    <p className="mt-1 text-sm text-white/80">Questions about sizing, delivery, or services — we reply fast.</p>
                  </div>
                  <div className="mt-6 flex gap-2">
                    {vendor.phone ? (
                      <a href={`tel:${vendor.phone}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50">
                        <Phone className="h-4 w-4" /> Call
                      </a>
                    ) : null}
                    {vendor.email ? (
                      <a href={`mailto:${vendor.email}`} className="inline-flex h-10 items-center rounded-full bg-orange-700 px-4 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-orange-800">
                        Email
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="bento-reveal sm:col-span-3 lg:col-span-4" style={{ animationDelay: `${(visible.length + 1) * 60}ms` }}>
                <div className="flex h-full flex-col justify-between rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Secure & trusted</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">Pay in Naira with Bachs</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">Your bag is saved per-store. Checkout is hosted and encrypted — no account needed.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <BrandLogo className="h-6 w-6" /> Kurospace • {vendor.slug}.kurospace.com
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer id="contact" className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <StoreMark vendor={vendor} size={36} />
              <p className="font-semibold tracking-tight text-slate-900">{vendor.businessName}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {vendor.description || vendor.category} {location ? `• ${location}` : ""}
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
              <BrandLogo className="h-8 w-8" />
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

function StoreMark({
  vendor,
  size = 40,
  rounded = "rounded-xl",
}: {
  vendor: Vendor;
  size?: number;
  rounded?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${rounded} bg-teal-700 text-sm font-bold text-white`}
      style={{ width: size, height: size }}
    >
      {vendor.logoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        vendor.businessName.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function BentoCard({
  item,
  vendor,
  added,
  wished,
  onAdd,
  onWishlist,
  featured,
}: {
  item: CatalogItem;
  vendor: Vendor;
  added: boolean;
  wished: boolean;
  onAdd: () => void;
  onWishlist: () => void;
  featured?: boolean;
}) {
  const href = `/store/${vendor.slug}/product/${item.id}`;
  const hoverSrc = item.images[1];

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onAdd();
  }
  function handleWish(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onWishlist();
  }

  return (
    <article
      className={`group relative flex w-full flex-col overflow-hidden rounded-[1.25rem] border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 ${
        featured ? "border-orange-200 shadow-orange-100/50" : "border-slate-200"
      } ${featured ? "min-h-[380px] sm:min-h-[420px]" : "min-h-[320px]"}`}
    >
      <div className={`relative overflow-hidden bg-slate-50 ${featured ? "aspect-[4/3] sm:aspect-[16/10] sm:flex-1" : "aspect-[4/3]"}`}>
        <Link href={href} className="absolute inset-0 block">
          {item.images[0] ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.images[0]}
                alt={item.name}
                className={`h-full w-full object-cover transition duration-700 ease-out ${
                  hoverSrc ? "group-hover:opacity-0 group-hover:scale-[1.04]" : "group-hover:scale-[1.06]"
                }`}
              />
              {hoverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hoverSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 ease-out group-hover:opacity-100 group-hover:scale-[1.04]"
                />
              ) : null}
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-slate-300">
              <Store className="h-10 w-10" />
            </span>
          )}
        </Link>

        {/* top bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
              item.featured ? "bg-orange-500 text-white shadow-md" : "bg-white/90 text-slate-700 shadow-sm backdrop-blur"
            }`}
          >
            {item.featured ? "Featured" : item.type}
          </span>
          <button
            type="button"
            onClick={handleWish}
            className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition ${
              wished
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white/90 text-slate-500 shadow-sm hover:bg-white hover:text-orange-600"
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* bottom add bar — slides in */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex translate-y-2 justify-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleAdd}
            className={`pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold shadow-lg transition ${
              added ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {added ? "Added" : featured ? "Add to bag" : "Add"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {item.category || item.type}
        </p>
        <Link href={href} className="mt-1 block">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-teal-800">
            {item.name}
          </h3>
        </Link>
        {item.shortDescription ? (
          <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-slate-500">{item.shortDescription}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-bold tabular-nums text-slate-900">{formatNaira(item.price)}</p>
          {item.compareAtPrice != null && item.compareAtPrice > item.price ? (
            <>
              <span className="text-xs font-normal text-slate-400 line-through">
                {formatNaira(item.compareAtPrice)}
              </span>
              <span className="inline-flex items-center rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-sm">
                Save {formatNaira(item.compareAtPrice - item.price)}
              </span>
            </>
          ) : null}
        </div>

        {/* mobile add button */}
        <button
          type="button"
          onClick={handleAdd}
          className={`mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition sm:hidden ${
            added ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {added ? "Added to bag" : "Add to bag"}
        </button>
      </div>
    </article>
  );
}
