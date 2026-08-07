/**
 * Netlify Function: notify vendor when an order is placed (SendLib).
 * Prefer Next.js routes in production; this remains as a Netlify alias.
 *
 * Docs: https://sendlib.samueltuoyo.com/docs/send
 * Env: SENDLIB_API_KEY (or EMAIL_PROVIDER_API_KEY), optional EMAIL_FROM
 */

import type { Handler, HandlerEvent } from "@netlify/functions";

interface NotifyBody {
  orderId?: string;
  orderNumber?: string;
  vendorId?: string;
  vendorEmail?: string;
  vendorName?: string;
  vendorSlug?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  total?: number;
  items?: { name: string; quantity: number; price: number }[];
  paymentStatus?: string;
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

  const apiKey = (
    process.env.SENDLIB_API_KEY ||
    process.env.EMAIL_PROVIDER_API_KEY ||
    ""
  ).trim();
  const base = (
    process.env.SENDLIB_BASE_URL ||
    process.env.EMAIL_PROVIDER_BASE_URL ||
    "https://sendlib.samueltuoyo.com"
  ).replace(/\/$/, "");

  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        emailSent: false,
        error: "SENDLIB_API_KEY not configured",
      }),
    };
  }

  if (!body.vendorEmail) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        emailSent: false,
        error: "vendorEmail required",
      }),
    };
  }

  const total = body.total ?? 0;
  const orderNumber = body.orderNumber || body.orderId || "order";
  const subject = `New Kurospace order ${orderNumber}`;
  const html = `<p>New order <strong>${orderNumber}</strong> from ${body.customerName || "a customer"}.</p>
    <p>Total: ₦${Number(total).toLocaleString()}</p>
    <p>Payment: ${body.paymentStatus || "pending"}</p>
    <p>Manage in your Kurospace dashboard → Orders.</p>`;

  const payload: Record<string, unknown> = {
    to: body.vendorEmail,
    subject,
    html,
    text: `New order ${orderNumber}. Total ₦${total}. Customer: ${body.customerName || ""}`,
  };
  if (process.env.EMAIL_FROM || process.env.SENDLIB_FROM) {
    payload.from = process.env.EMAIL_FROM || process.env.SENDLIB_FROM;
  }

  try {
    const res = await fetch(`${base}/api/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    return {
      statusCode: res.ok ? 200 : res.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: res.ok,
        emailSent: res.ok,
        provider: "sendlib",
        response: json,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        emailSent: false,
        error: e instanceof Error ? e.message : "Send failed",
      }),
    };
  }
};
