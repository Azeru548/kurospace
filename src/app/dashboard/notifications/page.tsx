"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from "@/lib/firebase/notifications";
import { formatDate } from "@/lib/utils";
import type { AppNotification } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail } from "lucide-react";
import { InlineLoader } from "@/components/brand/brand-logo";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(
      user.uid,
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Could not load notifications.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const unread = items.filter((n) => !n.read);

  async function markOne(n: AppNotification) {
    if (!user || n.read) return;
    await markNotificationRead(user.uid, n.id);
  }

  async function markAll() {
    if (!user || !unread.length) return;
    await markAllNotificationsRead(
      user.uid,
      unread.map((n) => n.id)
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            New orders and payment alerts for your store.
          </p>
        </div>
        {unread.length > 0 ? (
          <Button variant="outline" size="sm" onClick={() => void markAll()}>
            Mark all read
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-700" />
            In-app feed
          </CardTitle>
          <CardDescription>
            {unread.length
              ? `${unread.length} unread`
              : "You are up to date."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <InlineLoader />
          ) : error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No notifications yet. Place a test order from your storefront to populate this feed.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link || "/dashboard/orders"}
                    onClick={() => void markOne(n)}
                    className={`block px-1 py-3 transition hover:bg-slate-50 ${
                      n.read ? "" : "bg-teal-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                      </div>
                      {!n.read ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-700" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {n.createdAt ? formatDate(n.createdAt) : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-700" />
            Email notifications (SendLib)
          </CardTitle>
          <CardDescription>
            Set <code className="text-xs">SENDLIB_API_KEY</code> on the server. Emails go to your
            business email in Settings and the customer&apos;s checkout email.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            <li>Checkout started → vendor + customer (payment pending)</li>
            <li>Bachs payment confirmed → vendor + customer (paid)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
