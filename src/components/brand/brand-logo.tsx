import { cn } from "@/lib/utils";

/** Compact shop-window mark for headers and nav. */
export function BrandLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Kurospace"
      width={size}
      height={size}
      className={cn("h-8 w-8 object-contain", className)}
    />
  );
}

/** Icon + wordmark used in marketing, auth, and dashboard chrome. */
export function BrandLockup({
  className,
  wordmark = "Kurospace",
}: {
  className?: string;
  wordmark?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold text-slate-900", className)}>
      <BrandLogo />
      {wordmark}
    </span>
  );
}

/** Full illustrated logo + “kuro” wordmark for splash and page loaders. */
export function FullBrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/full-logo.png"
      alt="Kurospace"
      className={cn("h-40 w-auto object-contain sm:h-48", className)}
    />
  );
}

/** Full-page loading state using full-logo.png. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <FullBrandLogo className="animate-logo-pulse" />
      {label ? <p className="mt-5 text-sm text-slate-500">{label}</p> : null}
    </div>
  );
}

/** Smaller full-logo pulse for in-page loading (lists, tables). */
export function InlineLoader() {
  return (
    <div className="flex justify-center py-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/full-logo.png"
        alt="Loading"
        className="h-24 w-auto animate-logo-pulse object-contain"
      />
    </div>
  );
}
