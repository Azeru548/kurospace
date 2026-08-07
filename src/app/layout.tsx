import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

/**
 * System fonts only — avoids downloading Google fonts on every cold load.
 * Big win on slow networks / first compile of font modules.
 */
export const metadata: Metadata = {
  title: {
    default: "Kurospace — Sell online across Nigeria",
    template: "%s · Kurospace",
  },
  description:
    "Hybrid marketplace and SaaS for Nigerian vendors. List products and services, get orders, and launch a branded storefront with your own subdomain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
