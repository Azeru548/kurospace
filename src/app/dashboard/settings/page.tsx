"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { updateVendor } from "@/lib/firebase/vendors";
import { uploadVendorImage } from "@/lib/firebase/storage";
import { BUSINESS_CATEGORIES, NIGERIAN_STATES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { vendor, refreshVendor } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    description: "",
    category: "",
    phone: "",
    email: "",
    whatsapp: "",
    city: "",
    state: "Lagos",
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setForm({
      businessName: vendor.businessName,
      description: vendor.description ?? "",
      category: vendor.category,
      phone: vendor.phone ?? "",
      email: vendor.email ?? "",
      whatsapp: vendor.whatsapp ?? "",
      city: vendor.address?.city ?? "",
      state: vendor.address?.state ?? "Lagos",
      isPublished: vendor.isPublished,
    });
  }, [vendor]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    setMessage("");
    try {
      await updateVendor(vendor.id, {
        businessName: form.businessName.trim(),
        description: form.description.trim(),
        category: form.category,
        phone: form.phone,
        email: form.email,
        whatsapp: form.whatsapp,
        address: {
          city: form.city,
          state: form.state,
          country: "NG",
        },
        isPublished: form.isPublished,
      });
      await refreshVendor();
      setMessage("Settings saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogo(files: FileList | null) {
    if (!files?.[0] || !vendor) return;
    setLogoUploading(true);
    try {
      const url = await uploadVendorImage(vendor.id, files[0], "logo");
      await updateVendor(vendor.id, { logoURL: url });
      await refreshVendor();
      setMessage("Logo updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Logo upload failed.");
    } finally {
      setLogoUploading(false);
    }
  }

  if (!vendor) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Business profile and store visibility.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Store status</CardTitle>
            <CardDescription>
              {vendor.slug}.kurospace.com
            </CardDescription>
          </div>
          <Badge variant={form.isPublished ? "success" : "warning"}>
            {form.isPublished ? "Published" : "Draft"}
          </Badge>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Publish storefront (customers can browse and order)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-teal-100 text-xl font-bold text-teal-900">
                {vendor.logoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.logoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  vendor.businessName.charAt(0)
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => onLogo(e.target.files)}
                disabled={logoUploading}
                hint={logoUploading ? "Uploading…" : "Upload logo"}
              />
            </div>
            <Input
              label="Business name"
              required
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            </div>
            <Input
              label="Public email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
              <Select
                label="State"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            {message && (
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{message}</p>
            )}
            <Button type="submit" loading={saving}>
              Save settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
