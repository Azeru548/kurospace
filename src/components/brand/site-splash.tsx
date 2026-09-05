"use client";

import { useEffect, useState } from "react";
import { FullBrandLogo } from "@/components/brand/brand-logo";

const SPLASH_MS = 1600;

/** First-load splash. Mounts once with the root providers. */
export function SiteSplash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), SPLASH_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white px-6">
      <FullBrandLogo className="animate-logo-pulse h-44 sm:h-56" />
      <div
        className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-slate-100 sm:w-52"
        role="progressbar"
        aria-label="Loading Kurospace"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full w-full rounded-full bg-teal-700 animate-splash-progress" />
      </div>
    </div>
  );
}
