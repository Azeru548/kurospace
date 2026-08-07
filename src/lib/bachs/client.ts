import { getBachsApiKey, getBachsBaseUrl } from "./config";

export interface CreateBachsCheckoutInput {
  /** Order total in NGN (whole naira) */
  amountNgn: number;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  /** Our Firestore order id — used as Bachs reference + metadata */
  orderId: string;
  orderNumber: string;
  vendorId: string;
  vendorSlug: string;
  successUrl: string;
  cancelUrl: string;
}

export interface BachsCheckoutSession {
  checkout_id: string;
  checkout_url: string;
  status: string;
  expires_at?: string;
  created_at?: string;
  reference?: string;
}

export class BachsApiError extends Error {
  status: number;
  errorCode?: string;
  detail?: string;

  constructor(status: number, body: { detail?: string; error_code?: string }) {
    super(body.detail || `Bachs API error (${status})`);
    this.name = "BachsApiError";
    this.status = status;
    this.errorCode = body.error_code;
    this.detail = body.detail;
  }
}

/**
 * Create a pure one-time checkout (no Bachs product catalog).
 * Amount must be a decimal string at currency precision — never minor units.
 */
export async function createBachsCheckoutSession(
  input: CreateBachsCheckoutInput
): Promise<BachsCheckoutSession> {
  const apiKey = getBachsApiKey();
  if (!apiKey) {
    throw new Error("BACHS_API_KEY is not configured on the server.");
  }

  // NGN: two decimal places as string (e.g. "15000.00")
  const amount = input.amountNgn.toFixed(2);

  const body = {
    pricing: {
      currency: "NGN",
      amount,
      price_type: "fixed" as const,
    },
    customer: {
      email: input.customer.email,
      name: input.customer.name,
      ...(input.customer.phone
        ? { phone_number: normalizeNgPhone(input.customer.phone) }
        : {}),
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    reference: input.orderId.slice(0, 128),
    metadata: {
      order_id: input.orderId,
      order_number: input.orderNumber,
      vendor_id: input.vendorId,
      vendor_slug: input.vendorSlug,
      platform: "kurospace",
    },
    expires_in_minutes: 60,
  };

  const res = await fetch(`${getBachsBaseUrl()}/v1/checkout-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `order_${input.orderId}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as BachsCheckoutSession & {
    detail?: string;
    error_code?: string;
  };

  if (!res.ok) {
    throw new BachsApiError(res.status, json);
  }

  if (!json.checkout_url) {
    throw new Error("Bachs did not return a checkout_url.");
  }

  return json;
}

function normalizeNgPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}
