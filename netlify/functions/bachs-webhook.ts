/**
 * Optional Netlify function alias for Bachs webhooks.
 * Prefer the Next.js route: POST /api/payments/webhook
 * (works on Netlify with @netlify/plugin-nextjs).
 *
 * If you register this function URL instead:
 *   https://your-site.netlify.app/.netlify/functions/bachs-webhook
 * set the same BACHS_WEBHOOK_SECRET + Firebase Admin env vars.
 */

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const host = event.headers.host || event.headers.Host || "localhost";
  const proto = event.headers["x-forwarded-proto"] || "https";
  const target = `${proto}://${host}/api/payments/webhook`;

  const res = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bachs-timestamp":
        event.headers["x-bachs-timestamp"] || event.headers["X-Bachs-Timestamp"] || "",
      "x-bachs-signature":
        event.headers["x-bachs-signature"] || event.headers["X-Bachs-Signature"] || "",
    },
    body: event.body || "",
  });

  const text = await res.text();
  return {
    statusCode: res.status,
    headers: { "Content-Type": "application/json" },
    body: text,
  };
};
