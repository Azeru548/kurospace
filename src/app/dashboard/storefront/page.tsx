"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { updateVendor } from "@/lib/firebase/vendors";
import { uploadVendorImage } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ImagePlus } from "lucide-react";

export default function StorefrontPage() {
  const { vendor, refreshVendor } = useAuth();
  const [message, setMessage] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Storefront</h1>
          <p className="mt-1 text-sm text-slate-600">
            Every shop on Kurospace uses the same professional storefront. You supply the
            photos and listings.
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
              : "linear-gradient(145deg, #0F766E, #134E4A)",
          }}
        />
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-teal-700 text-lg font-semibold text-white">
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
          <CardDescription>
            Wide banner at the top of your store. Logo is managed in Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
          {message ? (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
