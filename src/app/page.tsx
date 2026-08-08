import Link from "next/link";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bell,
  Globe2,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Business + catalog",
    body: "List your business, products, and services with images, pricing in Naira, and inventory.",
  },
  {
    icon: Globe2,
    title: "Branded subdomain",
    body: "Get yourname.kurospace.com — a personal storefront customers can trust and share.",
  },
  {
    icon: Palette,
    title: "Theme your shop",
    body: "Customise colours, typography, layout, and theme so the site matches your brand.",
  },
  {
    icon: ShoppingBag,
    title: "Orders that reach you",
    body: "Customers place orders from your catalog. You get in-app and email notifications.",
  },
  {
    icon: BarChart3,
    title: "Vendor analytics",
    body: "Track views, top products, and order trends from a dashboard built for busy sellers.",
  },
  {
    icon: Bell,
    title: "Stay in the loop",
    body: "Real-time notifications when orders land — never miss a customer again.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-teal-50/80 to-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-900">
                <Sparkles className="h-3.5 w-3.5" />
                Built for Nigerian vendors · Expanding across Africa
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Your shop. Your brand.{" "}
                <span className="text-teal-700">Your customers.</span>
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Kurospace is a hybrid marketplace and SaaS platform. Sign up, list products
                and services, get a branded website on your own subdomain, and manage orders
                from one dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button size="lg">Create free vendor account</Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline">
                    Browse products
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="ghost">
                    Browse stores
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                No coding required · Naira pricing · Mobile-friendly storefronts
              </p>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-teal-900/5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-teal-700" />
                    <div>
                      <p className="text-sm font-semibold">Adanna Fashion</p>
                      <p className="text-xs text-slate-500">adanna.kurospace.com</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    Live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Ankara Set", "Bridal Gown", "Tailoring", "Ready-to-wear"].map(
                    (name, i) => (
                      <div
                        key={name}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div
                          className={`mb-2 h-20 rounded-lg ${
                            i % 2 === 0 ? "bg-teal-200/60" : "bg-amber-200/50"
                          }`}
                        />
                        <p className="text-xs font-medium text-slate-800">{name}</p>
                        <p className="text-xs text-teal-800">₦{((i + 1) * 12500).toLocaleString()}</p>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <Package className="h-3.5 w-3.5 text-teal-700" />
                  New order · KS-20260807-A1B2 · ₦48,000
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Everything a modern Nigerian business needs online
            </h2>
            <p className="mt-2 text-slate-600">
              Marketplace discovery for customers. SaaS tools for vendors. One platform.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Storefronts */}
        <section
          id="storefronts"
          className="border-y border-slate-100 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  A real website, not just a profile page
                </h2>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  Every vendor can publish a branded storefront on a Kurospace subdomain.
                  Choose colours, fonts, theme, and layout so customers experience{" "}
                  <em>your</em> brand — while you still get marketplace reach and a powerful
                  dashboard.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {[
                    "Subdomain: yourbrand.kurospace.com",
                    "Products & services catalog",
                    "Custom colours, typography, themes & layouts",
                    "Order form with notifications to your dashboard & email",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Example URL
                </p>
                <p className="mt-1 font-mono text-lg text-teal-800">
                  chicfabrics.kurospace.com
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["#0F766E", "#F59E0B", "#0F172A", "#FFFFFF"].map((c) => (
                    <div key={c} className="text-center">
                      <div
                        className="h-10 w-10 rounded-lg border border-slate-200 shadow-sm"
                        style={{ background: c }}
                      />
                      <p className="mt-1 text-[10px] text-slate-500">{c}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Colour · Typography · Theme · Layout — all editable in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-2xl bg-teal-800 px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to put your business online?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-teal-100">
              Join Kurospace and launch your catalog and branded storefront in minutes.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-teal-900 hover:bg-teal-50"
                >
                  Get started free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Kurospace. Built for vendors across Nigeria & Africa.</p>
      </footer>
    </div>
  );
}
