"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Mail } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          In-app alerts for new orders. Email delivery will use your custom third-party service.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-700" />
            In-app feed
          </CardTitle>
          <CardDescription>
            When orders are placed, we will write to{" "}
            <code className="text-xs">users/{"{uid}"}/notifications</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No notifications yet. Place a test order from a storefront to populate this feed.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-700" />
            Email notifications (SendLib)
          </CardTitle>
          <CardDescription>
            Powered by{" "}
            <a
              href="https://sendlib.samueltuoyo.com/docs/send"
              className="text-teal-800 underline"
              target="_blank"
              rel="noreferrer"
            >
              SendLib
            </a>
            . Set <code className="text-xs">SENDLIB_API_KEY</code> on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Live triggers:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            <li>Checkout started → vendor + customer (payment pending)</li>
            <li>Bachs payment confirmed → vendor + customer (paid)</li>
          </ul>
          <p className="text-xs text-slate-500">
            Emails go to the business email on your Settings page and the customer&apos;s checkout
            email. Use a Gmail connected in SendLib as <code>EMAIL_FROM</code> if needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
