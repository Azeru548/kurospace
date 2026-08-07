/**
 * Netlify Function: notify vendor when an order is placed.
 *
 * Email: wire your custom third-party provider here when ready.
 * For now this logs the event and returns a stub success so the client path works.
 *
 * Env (later):
 *   EMAIL_PROVIDER_API_KEY=
 *   EMAIL_PROVIDER_BASE_URL=
 *   EMAIL_FROM=
 *   FIREBASE_SERVICE_ACCOUNT= (optional, for server-side Firestore writes)
 */

import type { Handler, HandlerEvent } from "@netlify/functions";

interface NotifyBody {
  orderId?: string;
  orderNumber?: string;
  vendorId?: string;
  vendorEmail?: string;
  customerName?: string;
  total?: number;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body: NotifyBody = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { orderNumber, vendorEmail, customerName, total, vendorId, orderId } = body;

  console.log("[notify-order]", {
    orderId,
    orderNumber,
    vendorId,
    vendorEmail,
    customerName,
    total,
  });

  // --- Custom email provider integration point ---
  // When you share your provider (API URL, auth, templates), we plug it in here.
  // Example shape:
  //
  // if (process.env.EMAIL_PROVIDER_API_KEY && vendorEmail) {
  //   await fetch(process.env.EMAIL_PROVIDER_BASE_URL + "/send", {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${process.env.EMAIL_PROVIDER_API_KEY}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       to: vendorEmail,
  //       from: process.env.EMAIL_FROM,
  //       subject: `New Kurospace order ${orderNumber}`,
  //       html: `...`,
  //     }),
  //   });
  // }

  const emailConfigured = Boolean(
    process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_PROVIDER_BASE_URL
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      emailSent: false,
      emailConfigured,
      message: emailConfigured
        ? "Provider configured — complete the send() implementation with your API shape."
        : "Stub notification logged. Share your email provider details to enable real emails.",
    }),
  };
};
