"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { XCircle } from "lucide-react";

function CancelledContent() {
  const params = useParams();
  const search = useSearchParams();
  const slug = String(params.slug || "");
  const orderId = search.get("order_id");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Payment cancelled</h1>
        <p className="mt-2 text-sm text-slate-600">
          You left Bachs checkout without paying. Your cart order is saved as unpaid — you can try
          again from the store.
        </p>
        {orderId && (
          <p className="mt-3 text-xs text-slate-400">Order ref: {orderId}</p>
        )}
        <Link
          href={`/store/${slug}`}
          className="mt-6 inline-block rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Return to store
        </Link>
      </div>
    </div>
  );
}

export default function OrderCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <CancelledContent />
    </Suspense>
  );
}
