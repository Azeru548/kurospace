import { NextResponse } from "next/server";
import { verifyBachsSignature, type BachsWebhookEvent } from "@/lib/bachs/webhook";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  emailCustomerOrder,
  emailVendorPaymentReceived,
} from "@/lib/email/order-emails";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const runtime = "nodejs";

/**
 * Bachs webhook endpoint.
 * Dashboard: add https://your-domain.com/api/payments/webhook
 * Events: collection.succeeded, collection.failed, checkout.expired
 * Set BACHS_WEBHOOK_SECRET from the endpoint signing secret.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.BACHS_WEBHOOK_SECRET || "";

  const timestamp = request.headers.get("x-bachs-timestamp");
  const signature = request.headers.get("x-bachs-signature");

  if (secret) {
    const ok = verifyBachsSignature(rawBody, secret, timestamp, signature);
    if (!ok) {
      console.warn("[bachs-webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn(
      "[bachs-webhook] BACHS_WEBHOOK_SECRET not set — accepting unsigned (dev only)"
    );
  }

  let event: BachsWebhookEvent;
  try {
    event = JSON.parse(rawBody) as BachsWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[bachs-webhook]", event.type, event.id);

  if (!isAdminConfigured()) {
    console.error(
      "[bachs-webhook] Firebase Admin not configured — cannot update orders. Set FIREBASE_SERVICE_ACCOUNT_JSON."
    );
    // Still 200 so Bachs does not endless-retry while you set up Admin;
    // change to 500 in prod if you want retries until configured.
    return NextResponse.json({
      ok: false,
      reason: "admin_not_configured",
      eventId: event.id,
    });
  }

  try {
    const db = getAdminDb();

    // Deduplicate events
    const eventRef = db.collection("webhookEvents").doc(event.id);
    const existing = await eventRef.get();
    if (existing.exists) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    if (event.type === "collection.succeeded") {
      await handleCollectionSucceeded(db, event);
    } else if (event.type === "collection.failed") {
      await handleCollectionFailed(db, event);
    } else if (event.type === "checkout.expired") {
      await handleCheckoutExpired(db, event);
    }

    await eventRef.set({
      type: event.type,
      receivedAt: FieldValue.serverTimestamp(),
      data: event.data ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bachs-webhook] handler error", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function resolveOrderId(
  db: Firestore,
  event: BachsWebhookEvent
): Promise<string | null> {
  const data = event.data;
  if (!data) return null;

  const fromMeta = data.metadata?.order_id;
  if (fromMeta) return fromMeta;

  if (data.reference) {
    // We set reference = Firestore order id
    const byRef = await db.collection("orders").doc(data.reference).get();
    if (byRef.exists) return byRef.id;
  }

  if (data.checkout_id) {
    const q = await db
      .collection("orders")
      .where("bachsCheckoutId", "==", data.checkout_id)
      .limit(1)
      .get();
    if (!q.empty) return q.docs[0]!.id;
  }

  return null;
}

async function handleCollectionSucceeded(db: Firestore, event: BachsWebhookEvent) {
  const orderId = await resolveOrderId(db, event);
  if (!orderId) {
    console.warn("[bachs-webhook] no order for collection.succeeded", event.data);
    return;
  }

  await db.collection("orders").doc(orderId).set(
    {
      paymentStatus: "paid",
      paymentMethod: "bachs",
      status: "confirmed",
      paymentRef: event.data?.charge_id || event.data?.checkout_id || event.id,
      bachsChargeId: event.data?.charge_id ?? null,
      bachsCheckoutId: event.data?.checkout_id ?? null,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // In-app notification + SendLib emails
  try {
    const orderSnap = await db.collection("orders").doc(orderId).get();
    const order = orderSnap.data();
    if (!order?.vendorId) return;

    const vendorSnap = await db.collection("vendors").doc(order.vendorId).get();
    const vendor = vendorSnap.data();
    const ownerId = vendor?.ownerId as string | undefined;

    if (ownerId) {
      await db.collection("users").doc(ownerId).collection("notifications").add({
        type: "order_placed",
        title: "Payment received",
        body: `Order ${order.orderNumber || orderId} paid via Bachs (₦${event.data?.amount || order.total}).`,
        link: `/dashboard/orders`,
        read: false,
        metadata: { orderId },
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const items = (order.items || []) as {
      name: string;
      quantity: number;
      price: number;
    }[];
    const customer = (order.customer || {}) as {
      name?: string;
      email?: string;
      phone?: string;
    };

    const emailPayload = {
      orderNumber: String(order.orderNumber || orderId),
      orderId,
      vendorName: String(vendor?.businessName || order.vendorSlug || "Store"),
      vendorSlug: String(order.vendorSlug || vendor?.slug || ""),
      customerName: String(customer.name || "Customer"),
      customerEmail: customer.email,
      customerPhone: customer.phone,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      total: Number(order.total || event.data?.amount || 0),
      paymentStatus: "paid",
    };

    await Promise.all([
      emailVendorPaymentReceived(vendor?.email as string | undefined, emailPayload),
      emailCustomerOrder(customer.email, {
        ...emailPayload,
        paymentStatus: "paid",
      }),
    ]);
  } catch (e) {
    console.error("[bachs-webhook] notification / email failed", e);
  }
}

async function handleCollectionFailed(db: Firestore, event: BachsWebhookEvent) {
  const orderId = await resolveOrderId(db, event);
  if (!orderId) return;
  await db.collection("orders").doc(orderId).set(
    {
      paymentStatus: "failed",
      paymentMethod: "bachs",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function handleCheckoutExpired(db: Firestore, event: BachsWebhookEvent) {
  const orderId = await resolveOrderId(db, event);
  if (!orderId) return;
  const snap = await db.collection("orders").doc(orderId).get();
  if (!snap.exists) return;
  if (snap.data()?.paymentStatus === "paid") return;
  await db.collection("orders").doc(orderId).set(
    {
      paymentStatus: "unpaid",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
