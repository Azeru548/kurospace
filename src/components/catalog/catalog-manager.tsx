"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  createCatalogItem,
  deleteCatalogItem,
  listCatalogItems,
  updateCatalogItem,
} from "@/lib/firebase/catalog";
import { uploadVendorImage } from "@/lib/firebase/storage";
import { formatNaira } from "@/lib/utils";
import type { CatalogItem, CatalogItemType, ProductStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";

const statusVariant: Record<ProductStatus, "default" | "success" | "warning" | "danger"> = {
  draft: "default",
  active: "success",
  archived: "default",
  out_of_stock: "warning",
};

interface Props {
  type: CatalogItemType;
  title: string;
  description: string;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  status: "active" as ProductStatus,
  stock: "",
  durationMinutes: "",
  bookingRequired: false,
  sku: "",
};

export function CatalogManager({ type, title, description }: Props) {
  const { vendor } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!vendor) return;
    setLoading(true);
    try {
      const data = await listCatalogItems(vendor.id, { type });
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.id, type]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setImages([]);
    setError("");
    setOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      compareAtPrice: item.compareAtPrice ? String(item.compareAtPrice) : "",
      status: item.status,
      stock: item.stock != null ? String(item.stock) : "",
      durationMinutes: item.durationMinutes != null ? String(item.durationMinutes) : "",
      bookingRequired: item.bookingRequired ?? false,
      sku: item.sku ?? "",
    });
    setImages(item.images ?? []);
    setError("");
    setOpen(true);
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length || !vendor) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 5)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadVendorImage(vendor.id, file, "catalog");
        urls.push(url);
      }
      setImages((prev) => [...prev, ...urls].slice(0, 8));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Image upload failed. Check Cloudinary env (NEXT_PUBLIC_CLOUDINARY_*)."
      );
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    setError("");
    try {
      const price = Number(form.price) || 0;
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        status: form.status,
        images,
        sku: form.sku || undefined,
        stock: form.stock ? Number(form.stock) : undefined,
        trackInventory: type === "product" && !!form.stock,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        bookingRequired: type === "service" ? form.bookingRequired : false,
      };

      if (editing) {
        await updateCatalogItem(editing.id, payload);
      } else {
        await createCatalogItem({
          vendorId: vendor.id,
          type,
          ...payload,
          tags: [],
        });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await deleteCatalogItem(id);
    await load();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add {type}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">No {type}s yet.</p>
            <Button className="mt-4" onClick={openCreate}>
              Add your first {type}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100">
                {item.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <ImagePlus className="h-8 w-8" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                </div>
                <p className="text-sm font-medium text-teal-800">{formatNaira(item.price)}</p>
                {item.shortDescription || item.description ? (
                  <p className="line-clamp-2 text-xs text-slate-500">
                    {item.shortDescription || item.description}
                  </p>
                ) : null}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editing ? `Edit ${type}` : `New ${type}`}
              </CardTitle>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Price (₦)"
                    type="number"
                    min={0}
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                  <Input
                    label="Compare-at price"
                    type="number"
                    min={0}
                    value={form.compareAtPrice}
                    onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
                  />
                </div>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))
                  }
                  options={[
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                    { value: "out_of_stock", label: "Out of stock" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
                {type === "product" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="SKU"
                      value={form.sku}
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    />
                    <Input
                      label="Stock qty"
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    />
                  </div>
                )}
                {type === "service" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Duration (minutes)"
                      type="number"
                      min={0}
                      value={form.durationMinutes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                      }
                    />
                    <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.bookingRequired}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, bookingRequired: e.target.checked }))
                        }
                        className="rounded border-slate-300"
                      />
                      Booking required
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Images</p>
                  <div className="flex flex-wrap gap-2">
                    {images.map((url) => (
                      <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
                          onClick={() => setImages((imgs) => imgs.filter((u) => u !== url))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onUpload(e.target.files)}
                    disabled={uploading}
                    hint={uploading ? "Uploading…" : "Up to 8 images. Requires Firebase Storage."}
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    {editing ? "Save changes" : `Create ${type}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
