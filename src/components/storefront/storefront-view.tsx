"use client";

import Link from "next/link";
import type { CatalogItem, Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";
import { formatNaira } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { Badge } from "@/components/ui/badge";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ShoppingBag } from "lucide-react";

export function StorefrontView({
  vendor,
  items,
}: {
  vendor: Vendor;
  items: CatalogItem[];
}) {
  const branding = { ...DEFAULT_BRANDING, ...vendor.branding };
  const { addItem, count } = useCart();

  const gridClass =
    branding.layout === "list"
      ? "space-y-4"
      : branding.layout === "showcase"
        ? "grid grid-cols-1 gap-5 sm:grid-cols-2"
        : "grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <StorefrontShell vendor={vendor}>
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
              className="store-heading text-xl sm:text-2xl"
              style={{
                color: branding.textColor,
                fontFamily: branding.headingFont || branding.fontFamily,
              }}
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
        <Link
          href={`/store/${vendor.slug}/cart`}
          className="store-btn-primary relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white"
          style={{ background: branding.primaryColor }}
        >
          <ShoppingBag className="h-4 w-4" />
          Cart
          {count > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: branding.accentColor, color: "#0f172a" }}
            >
              {count}
            </span>
          )}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {vendor.description && (
          <p className="store-muted mb-8 max-w-2xl text-sm opacity-80 sm:text-base">
            {vendor.description}
          </p>
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
                      ? "store-card flex gap-4 overflow-hidden p-3 sm:p-4"
                      : "store-card group flex flex-col overflow-hidden transition hover:shadow-md"
                  }
                  style={{ borderColor: `${branding.primaryColor}22` }}
                >
                  <Link
                    href={`/store/${vendor.slug}/product/${item.id}`}
                    className={
                      isList
                        ? "h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-black/5 sm:h-32 sm:w-32"
                        : "block aspect-[3/4] w-full overflow-hidden bg-black/5"
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
                  </Link>

                  <div
                    className={
                      isList
                        ? "flex min-w-0 flex-1 flex-col justify-between py-0.5"
                        : "flex flex-1 flex-col gap-1.5 p-3 sm:p-4"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/store/${vendor.slug}/product/${item.id}`}>
                        <h2 className="store-heading line-clamp-2 text-sm leading-snug hover:opacity-80 sm:text-[15px]">
                          {item.name}
                        </h2>
                      </Link>
                      {isList && (
                        <Badge variant="default" className="shrink-0 capitalize">
                          {item.type}
                        </Badge>
                      )}
                    </div>
                    {desc && (
                      <p className="store-muted line-clamp-2 text-xs opacity-70 sm:line-clamp-3">
                        {desc}
                      </p>
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
                        onClick={() => addItem(item, vendor.id, vendor.slug)}
                        className="store-btn-primary rounded-lg px-3 py-2 text-xs font-medium text-white sm:text-sm"
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

        <p className="store-muted mt-12 text-center text-xs opacity-40">
          Powered by Kurospace · {vendor.slug}.kurospace.com
        </p>
      </main>
    </StorefrontShell>
  );
}
