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

export default function LoginPage() {
  const { signIn, user, vendor, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [awaitingSession, setAwaitingSession] = useState(false);

  // Navigate only after profile + vendor are resolved — avoids the
  // dashboard ↔ onboarding redirect loop right after sign-in.
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!awaitingSession) return;
    router.replace(vendor || authError ? "/dashboard" : "/onboarding");
  }, [awaitingSession, authLoading, user, vendor, authError, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
          <Store className="h-4 w-4" />
        </span>
        Kurospace
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in to manage your business and storefront.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.ng"
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Log in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            New vendor?{" "}
            <Link href="/signup" className="font-medium text-teal-800 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
