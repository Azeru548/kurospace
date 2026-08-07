"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getOrder } from "@/lib/firebase/orders";
import { formatNaira } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

function SuccessContent() {
  const params = useParams();
  const search = useSearchParams();
  const slug = String(params.slug || "");
  const orderId = search.get("order_id") || "";
  const checkoutId = search.get("checkout_id") || "";
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "missing">("loading");
  const [orderNumber, setOrderNumber] = useState("");
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    let tries = 0;

    async function poll() {
      try {
        const order = await getOrder(orderId);
        if (cancelled) return;
        if (!order) {
          setStatus("missing");
          return;
        }
        setOrderNumber(order.orderNumber);
        setTotal(order.total);
        if (order.paymentStatus === "paid") {
          setStatus("paid");
          return;
        }
        // Webhook may lag a few seconds
        tries += 1;
        if (tries < 8) {
          setStatus("pending");
          setTimeout(poll, 1500);
        } else {
          setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("pending");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          {status === "paid" ? "Payment successful" : "Order received"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {status === "paid"
            ? "Bachs confirmed your payment. The vendor has been notified."
            : status === "pending"
              ? "You completed checkout. We’re confirming payment with Bachs — this usually takes a few seconds. The vendor will see the order either way."
              : status === "loading"
                ? "Confirming your order…"
                : "Thanks for your order. If you paid, confirmation may take a moment."}
        </p>
        {orderNumber && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
            {orderNumber}
            {total != null ? ` · ${formatNaira(total)}` : ""}
          </p>
        )}
        {checkoutId && (
          <p className="mt-2 text-xs text-slate-400">Checkout: {checkoutId}</p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/store/${slug}`}
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
          >
            Back to store
          </Link>
          <Link href="/marketplace" className="text-sm text-teal-800 hover:underline">
            Browse marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
