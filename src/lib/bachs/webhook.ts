import crypto from "crypto";

/**
 * Verify Bachs webhook signature.
 * Headers: X-Bachs-Timestamp, X-Bachs-Signature
 * Message: `{timestamp}.{rawBody}` HMAC-SHA256 hex with endpoint secret
 */
export function verifyBachsSignature(
  rawBody: string,
  secret: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  toleranceSeconds = 300
): boolean {
  if (!secret || !timestampHeader || !signatureHeader) return false;

  const timestamp = parseInt(timestampHeader, 10);
  if (Number.isNaN(timestamp)) return false;

  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) {
    return false;
  }

  const message = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface BachsWebhookEvent {
  id: string;
  type: string;
  created_at?: string;
  organization_id?: string;
  data?: {
    charge_id?: string | null;
    checkout_id?: string | null;
    reference?: string | null;
    status?: string;
    amount?: string;
    currency?: string;
    payment_method?: string;
    metadata?: Record<string, string>;
    customer?: { id?: string; email?: string; name?: string };
  };
}
