import { NextResponse } from "next/server";
import { createBachsCheckoutSession, BachsApiError } from "@/lib/bachs/client";
import {
  BACHS_NGN_MINIMUM,
  getAppUrl,
  isBachsConfigured,
} from "@/lib/bachs/config";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  emailCustomerOrder,
  emailVendorNewOrder,
} from "@/lib/email/order-emails";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

interface Body {
  orderId: string;
  orderNumber: string;
  vendorId: string;
  vendorSlug: string;
  amountNgn: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

export async function POST(request: Request) {
  try {
    if (!isBachsConfigured()) {
      return NextResponse.json(
        {
          error:
            "Bachs is not configured. Add BACHS_API_KEY (sk_sandbox_... or sk_live_...) to server env.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Body;
    const { orderId, orderNumber, vendorId, vendorSlug, amountNgn, customer } = body;

    if (!orderId || !vendorId || !vendorSlug || !orderNumber) {
      return NextResponse.json({ error: "Missing order fields." }, { status: 400 });
    }
    if (!customer?.name?.trim() || !customer?.email?.trim()) {
      return NextResponse.json(
        { error: "Customer name and email are required for payment." },
        { status: 400 }
      );
    }
    if (!amountNgn || amountNgn < BACHS_NGN_MINIMUM) {
      return NextResponse.json(
        {
          error: `Order total must be at least ₦${BACHS_NGN_MINIMUM.toLocaleString()} to pay with Bachs.`,
        },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl();
    const successUrl = `${appUrl}/store/${encodeURIComponent(vendorSlug)}/order/success?order_id=${encodeURIComponent(orderId)}`;
    const cancelUrl = `${appUrl}/store/${encodeURIComponent(vendorSlug)}/order/cancelled?order_id=${encodeURIComponent(orderId)}`;

    const session = await createBachsCheckoutSession({
      amountNgn,
      orderId,
      orderNumber,
      vendorId,
      vendorSlug,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone,
      },
      successUrl,
      cancelUrl,
    });

    // Attach Bachs checkout ids + email vendor (Admin preferred for order read)
    if (isAdminConfigured()) {
      try {
        const db = getAdminDb();
        await db.collection("orders").doc(orderId).set(
          {
            paymentMethod: "bachs",
            paymentStatus: "pending",
            paymentRef: session.checkout_id,
            bachsCheckoutId: session.checkout_id,
            bachsCheckoutUrl: session.checkout_url,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const [orderSnap, vendorSnap] = await Promise.all([
          db.collection("orders").doc(orderId).get(),
          db.collection("vendors").doc(vendorId).get(),
        ]);
        const order = orderSnap.data();
        const vendor = vendorSnap.data();
        const items = (order?.items || []) as {
          name: string;
          quantity: number;
          price: number;
        }[];

        const emailPayload = {
          orderNumber,
          orderId,
          vendorName: (vendor?.businessName as string) || vendorSlug,
          vendorSlug,
          customerName: customer.name.trim(),
          customerEmail: customer.email.trim(),
          customerPhone: customer.phone,
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          total: amountNgn,
          paymentStatus: "pending (checkout started)",
        };

        // Business email on vendor profile (set during onboarding / settings)
        void emailVendorNewOrder(vendor?.email as string | undefined, emailPayload);
        void emailCustomerOrder(customer.email, emailPayload);
      } catch (e) {
        console.error("[create-checkout] failed to patch order / email", e);
      }
    }

    return NextResponse.json({
      checkoutId: session.checkout_id,
      checkoutUrl: session.checkout_url,
      status: session.status,
    });
  } catch (err) {
    console.error("[create-checkout]", err);
    if (err instanceof BachsApiError) {
      return NextResponse.json(
        { error: err.detail || err.message, errorCode: err.errorCode },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
