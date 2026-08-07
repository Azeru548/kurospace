/**
 * SendLib — transactional email via Gmail OAuth relay
 * Docs: https://sendlib.samueltuoyo.com/docs/send
 *
 * POST https://sendlib.samueltuoyo.com/api/send
 * Auth: Authorization: Bearer <API_KEY>  or  x-api-key: <API_KEY>
 */

export interface SendLibAttachment {
  filename: string;
  content: string; // base64
  type?: string;
}

export interface SendLibMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: SendLibAttachment[];
}

export interface SendLibResult {
  ok: boolean;
  status: number;
  body?: unknown;
  error?: string;
  skipped?: boolean;
}

function getApiKey(): string {
  return (
    process.env.SENDLIB_API_KEY ||
    process.env.EMAIL_PROVIDER_API_KEY ||
    ""
  ).trim();
}

function getBaseUrl(): string {
  return (
    process.env.SENDLIB_BASE_URL ||
    process.env.EMAIL_PROVIDER_BASE_URL ||
    "https://sendlib.samueltuoyo.com"
  ).replace(/\/$/, "");
}

export function isSendLibConfigured(): boolean {
  return Boolean(getApiKey());
}

/**
 * Send one transactional email through SendLib.
 * No-ops (skipped) if API key is missing so local/dev never hard-fails.
 */
export async function sendEmail(message: SendLibMessage): Promise<SendLibResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[sendlib] SENDLIB_API_KEY not set — email skipped:", message.subject);
    return { ok: false, status: 0, skipped: true, error: "SENDLIB_API_KEY not configured" };
  }

  const from = message.from || process.env.EMAIL_FROM || process.env.SENDLIB_FROM;
  const replyTo = message.replyTo || process.env.EMAIL_REPLY_TO;

  const payload: Record<string, unknown> = {
    to: message.to,
    subject: message.subject,
    html: message.html,
  };
  if (message.text) payload.text = message.text;
  if (from) payload.from = from;
  if (replyTo) payload.replyTo = replyTo;
  if (message.cc) payload.cc = message.cc;
  if (message.bcc) payload.bcc = message.bcc;
  if (message.attachments?.length) payload.attachments = message.attachments;

  try {
    const res = await fetch(`${getBaseUrl()}/api/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[sendlib] send failed", res.status, body);
      return {
        ok: false,
        status: res.status,
        body,
        error:
          typeof body === "object" && body && "message" in body
            ? String((body as { message: unknown }).message)
            : `SendLib error ${res.status}`,
      };
    }

    return { ok: true, status: res.status, body };
  } catch (e) {
    console.error("[sendlib] network error", e);
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
