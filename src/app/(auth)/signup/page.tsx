"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { formatAuthError } from "@/lib/firebase/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function SignupPage() {
  const { signUp, user, vendor, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [awaitingSession, setAwaitingSession] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (!awaitingSession || authLoading) return;
    if (!user) return;
    router.replace(vendor || authError ? "/dashboard" : "/onboarding");
  }, [awaitingSession, authLoading, user, vendor, authError, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || undefined,
      });
      setAwaitingSession(true);
    } catch (err) {
      // Don't console.error the Error object — Next.js 16 treats that as an overlay crash.
      setError(formatAuthError(err));
      setAwaitingSession(false);
    } finally {
      setSubmitting(false);
    }
  }

  const loading = submitting || awaitingSession;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
          <Store className="h-4 w-4" />
        </span>
        Kurospace
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start selling on Kurospace</CardTitle>
          <CardDescription>
            Create your vendor account. Next, we&apos;ll set up your business and storefront.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Full name"
              name="displayName"
              required
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Chioma Okafor"
            />
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@business.ng"
            />
            <Input
              label="Phone (WhatsApp preferred)"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0801 234 5678"
              hint="Customers and order alerts may use this later."
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              hint="At least 6 characters."
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-teal-800 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
