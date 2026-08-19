"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createVendor, generateUniqueSlug, isSlugAvailable } from "@/lib/firebase/vendors";
import { slugify } from "@/lib/utils";
import { BUSINESS_CATEGORIES, NIGERIAN_STATES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function OnboardingPage() {
  const { user, vendor, loading, refreshVendor, refreshProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    slug: "",
    category: BUSINESS_CATEGORIES[0],
    description: "",
    phone: "",
    city: "",
    state: "Lagos",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [slugHint, setSlugHint] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (vendor) router.replace("/dashboard");
  }, [loading, user, vendor, router]);

  useEffect(() => {
    if (!form.slug || form.slug.length < 3) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const available = await isSlugAvailable(form.slug);
        if (!cancelled) {
          setSlugHint(
            available
              ? `${form.slug}.kurospace.com is available`
              : "That store URL is taken — try another."
          );
        }
      } catch {
        if (!cancelled) setSlugHint("");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.slug]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSaving(true);
    try {
      let slug = slugify(form.slug || form.businessName);
      if (!(await isSlugAvailable(slug))) {
        slug = await generateUniqueSlug(form.businessName);
      }
      await createVendor({
        ownerId: user.uid,
        businessName: form.businessName,
        category: form.category,
        description: form.description,
        phone: form.phone || undefined,
        email: user.email || undefined,
        city: form.city,
        state: form.state,
        slug,
      });
      await refreshVendor();
      await refreshProfile();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create business.");
    } finally {
      setSaving(false);
    }
  }

  // Spinner while auth loads or while redirecting (logged out / already has vendor)
  if (loading || !user || vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  const autoSlug = !slugTouched && form.businessName ? slugify(form.businessName) : form.slug;

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 px-4 py-10">
      <div className="mb-6 flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
          <Store className="h-4 w-4" />
        </span>
        Set up your business
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Tell us about your business</CardTitle>
          <CardDescription>
            This powers your marketplace profile and branded storefront subdomain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Business name"
              required
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="Adanna Fashion Hub"
            />
            <Input
              label="Store URL (subdomain)"
              required
              value={autoSlug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              hint={
                autoSlug.length >= 3
                  ? slugHint || "Letters, numbers, and hyphens only."
                  : "Letters, numbers, and hyphens only."
              }
              placeholder="adanna-fashion"
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Textarea
              label="Short description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What do you sell or offer?"
            />
            <Input
              label="Business phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0801 234 5678"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Ikeja"
              />
              <Select
                label="State"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" loading={saving}>
              Create business & continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
