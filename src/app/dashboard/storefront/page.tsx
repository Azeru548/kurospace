"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { updateVendorBranding } from "@/lib/firebase/vendors";
import {
  DEFAULT_BRANDING,
  FONT_OPTIONS,
  type StorefrontLayout,
  type StorefrontTheme,
  type VendorBranding,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StorefrontPage() {
  const { vendor, refreshVendor } = useAuth();
  const [branding, setBranding] = useState<VendorBranding>(DEFAULT_BRANDING);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (vendor?.branding) setBranding({ ...DEFAULT_BRANDING, ...vendor.branding });
  }, [vendor]);

  function set<K extends keyof VendorBranding>(key: K, value: VendorBranding[K]) {
    setBranding((b) => ({ ...b, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    setMessage("");
    try {
      await updateVendorBranding(vendor.id, branding);
      await refreshVendor();
      setMessage("Storefront branding saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (!vendor) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Storefront branding</h1>
        <p className="mt-1 text-sm text-slate-600">
          Customise how customers see{" "}
          <span className="font-medium text-teal-800">{vendor.slug}.kurospace.com</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Theme & layout</CardTitle>
            <CardDescription>Colours, typography, and structure of your shop site.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["primaryColor", "Primary"],
                    ["secondaryColor", "Secondary"],
                    ["accentColor", "Accent"],
                    ["backgroundColor", "Background"],
                    ["textColor", "Text"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">{label}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={branding[key]}
                        onChange={(e) => set(key, e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded border border-slate-300"
                      />
                      <Input
                        value={branding[key]}
                        onChange={(e) => set(key, e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Select
                label="Body font"
                value={branding.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value)}
                options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
              />
              <Select
                label="Heading font"
                value={branding.headingFont || branding.fontFamily}
                onChange={(e) => set("headingFont", e.target.value)}
                options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
              />
              <Select
                label="Theme"
                value={branding.theme}
                onChange={(e) => set("theme", e.target.value as StorefrontTheme)}
                options={[
                  { value: "minimal", label: "Minimal" },
                  { value: "bold", label: "Bold" },
                  { value: "elegant", label: "Elegant" },
                  { value: "marketplace", label: "Marketplace" },
                ]}
              />
              <Select
                label="Catalog layout"
                value={branding.layout}
                onChange={(e) => set("layout", e.target.value as StorefrontLayout)}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "list", label: "List" },
                  { value: "catalog", label: "Catalog" },
                  { value: "showcase", label: "Showcase" },
                ]}
              />

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={branding.showLogo}
                  onChange={(e) => set("showLogo", e.target.checked)}
                />
                Show logo
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={branding.showCover}
                  onChange={(e) => set("showCover", e.target.checked)}
                />
                Show cover banner
              </label>

              {message && (
                <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{message}</p>
              )}
              <Button type="submit" loading={saving}>
                Save branding
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Approximate look of your public storefront.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="min-h-[420px] p-5"
              style={{
                background: branding.backgroundColor,
                color: branding.textColor,
                fontFamily: branding.fontFamily,
              }}
            >
              {branding.showCover && (
                <div
                  className="mb-4 h-24 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                  }}
                />
              )}
              <div className="mb-4 flex items-center gap-3">
                {branding.showLogo && (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ background: branding.primaryColor }}
                  >
                    {vendor.businessName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2
                    className="text-lg font-bold"
                    style={{ fontFamily: branding.headingFont || branding.fontFamily }}
                  >
                    {vendor.businessName}
                  </h2>
                  <p className="text-xs opacity-70">{vendor.category}</p>
                </div>
              </div>
              <p className="mb-4 text-sm opacity-80 line-clamp-2">
                {vendor.description || "Your business description will appear here."}
              </p>
              <div
                className={
                  branding.layout === "list"
                    ? "space-y-2"
                    : "grid grid-cols-2 gap-3"
                }
              >
                {["Sample product", "Sample service", "Featured item", "New arrival"].map(
                  (name, i) => (
                    <div
                      key={name}
                      className="rounded-lg border p-3"
                      style={{ borderColor: `${branding.primaryColor}33` }}
                    >
                      <div
                        className="mb-2 h-16 rounded-md"
                        style={{
                          background:
                            i % 2 === 0
                              ? `${branding.primaryColor}22`
                              : `${branding.accentColor}33`,
                        }}
                      />
                      <p className="text-xs font-medium">{name}</p>
                      <p className="text-xs font-semibold" style={{ color: branding.primaryColor }}>
                        ₦{(i + 1) * 10000}
                      </p>
                    </div>
                  )
                )}
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-lg py-2 text-sm font-medium text-white"
                style={{ background: branding.primaryColor }}
              >
                Place order
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
