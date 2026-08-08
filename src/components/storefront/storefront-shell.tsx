"use client";

import { useEffect, type ReactNode } from "react";
import type { Vendor } from "@/types";
import { DEFAULT_BRANDING } from "@/types";
import { brandVars, themeClassName } from "@/lib/store-theme";

/**
 * Branded shell for store subdomains. Wraps every public store page and:
 * - Applies the vendor's colors/fonts/theme as CSS variables
 * - Injects the vendor's custom CSS
 * - Sets a branded browser tab title + favicon
 */
export function StorefrontShell({
  vendor,
  children,
}: {
  vendor: Vendor;
  children: ReactNode;
}) {
  const branding = { ...DEFAULT_BRANDING, ...vendor.branding };

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${vendor.businessName} · Kurospace`;

    const setFavicon = (url: string) => {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    };
    if (vendor.logoURL) setFavicon(vendor.logoURL);

    return () => {
      document.title = previousTitle;
    };
  }, [vendor.businessName, vendor.logoURL]);

  return (
    <div
      className={`min-h-screen ${themeClassName(branding)}`}
      style={brandVars(branding)}
    >
      {branding.customCss ? (
        <style
          dangerouslySetInnerHTML={{ __html: branding.customCss }}
          data-store-custom-css
        />
      ) : null}
      {children}
    </div>
  );
}
