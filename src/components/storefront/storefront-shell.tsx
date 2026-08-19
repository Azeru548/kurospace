"use client";

import { useEffect, type ReactNode } from "react";
import type { Vendor } from "@/types";

/** Shared Kurospace chrome for public store pages (title + favicon only). */
export function StorefrontShell({
  vendor,
  children,
}: {
  vendor: Vendor;
  children: ReactNode;
}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${vendor.businessName} · Kurospace`;

    if (vendor.logoURL) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = vendor.logoURL;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [vendor.businessName, vendor.logoURL]);

  return <div className="flex min-h-screen flex-col bg-white text-slate-900">{children}</div>;
}
