"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { updateVendor, updateVendorBranding } from "@/lib/firebase/vendors";
import { uploadVendorImage } from "@/lib/firebase/storage";
import { DEFAULT_BRANDING } from "@/types";
import { storeBrand } from "@/lib/store-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ImagePlus, RotateCcw } from "lucide-react";

const COLOR_FIELDS = [
  ["primaryColor", "Primary"],
  ["secondaryColor", "Secondary"],
  ["accentColor", "Accent"],
] as const;

export default function StorefrontPage() {
  const { vendor, refreshVendor } = useAuth();
  const [message, setMessage] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [syncedId, setSyncedId] = useState<string | null>(null);
  const [colors, setColors] = useState({
    primaryColor: DEFAULT_BRANDING.primaryColor,
    secondaryColor: DEFAULT_BRANDING.secondaryColor,
    accentColor: DEFAULT_BRANDING.accentColor,
  });

  if (vendor && vendor.id !== syncedId) {
    const b = storeBrand(vendor);
    setSyncedId(vendor.id);
    setColors({
      primaryColor: b.primaryColor,
      secondaryColor: b.secondaryColor,
      accentColor: b.accentColor,
    });
  }

  if (!vendor) return null;

  const storePath = `/store/${vendor.slug}`;

  async function onCover(files: FileList | null) {
    if (!files?.[0] || !vendor) return;
    setCoverUploading(true);
    setMessage("");
    try {
      const url = await uploadVendorImage(vendor.id, files[0], "cover");
      await updateVendor(vendor.id, { coverURL: url });
      await refreshVendor();
      setMessage("Cover image updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Cover upload failed.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function saveColors() {
    if (!vendor) return;
    setSaving(true);
    setMessage("");
    try {
      await updateVendorBranding(vendor.id, colors);
      await refreshVendor();
      setMessage("Store colours saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save colours.");
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefault() {
    if (!vendor) return;
    setResetting(true);
    setMessage("");
    try {
      await updateVendor(vendor.id, { branding: { ...DEFAULT_BRANDING } });
      await refreshVendor();
      setColors({
        primaryColor: DEFAULT_BRANDING.primaryColor,
        secondaryColor: DEFAULT_BRANDING.secondaryColor,
        accentColor: DEFAULT_BRANDING.accentColor,
      });
      setMessage("Restored Kurospace default colours (teal, forest, amber).");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not restore defaults.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Storefront</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cover, logo, and accent colours for {vendor.slug}.kurospace.com
          </p>
        </div>
        <Link href={storePath} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            View live store
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div
          className="h-36 bg-cover bg-center sm:h-44"
          style={{
            backgroundImage: vendor.coverURL
              ? `url(${vendor.coverURL})`
              : `linear-gradient(145deg, ${colors.primaryColor}, ${colors.secondaryColor})`,
          }}
        />
        <CardContent className="flex items-center gap-4 py-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-semibold text-white"
            style={{ background: colors.primaryColor }}
          >
            {vendor.logoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              vendor.businessName.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{vendor.businessName}</p>
            <p className="truncate text-sm text-slate-500">{vendor.category}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover image</CardTitle>
          <CardDescription>Wide banner at the top of your store. Logo is in Settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <ImagePlus className="h-4 w-4" />
            {coverUploading ? "Uploading…" : "Upload cover"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={coverUploading}
              onChange={(e) => void onCover(e.target.files)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colour theme</CardTitle>
          <CardDescription>
            Used for buttons, cart, filters, and the banner when you have no cover photo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {COLOR_FIELDS.map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">{label}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                    className="h-10 w-12 cursor-pointer rounded border border-slate-300"
                  />
                  <Input
                    value={colors[key]}
                    onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void saveColors()} loading={saving}>
              Save colours
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={resetting}
              onClick={() => void restoreDefault()}
            >
              <RotateCcw className="h-4 w-4" />
              Restore default theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {message ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{message}</p>
      ) : null}
    </div>
  );
}
