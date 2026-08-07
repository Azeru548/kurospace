/**
 * Bachs platform config (Kurospace is the single merchant).
 * Sandbox: sk_sandbox_... → https://sandbox-api.bachs.io
 * Live:    sk_live_...    → https://api.bachs.io
 */
export function getBachsApiKey(): string {
  const key = process.env.BACHS_API_KEY || process.env.BACHS_SECRET || "";
  return key.trim();
}

export function getBachsBaseUrl(): string {
  if (process.env.BACHS_API_BASE) return process.env.BACHS_API_BASE.replace(/\/$/, "");
  const key = getBachsApiKey();
  if (key.startsWith("sk_live_")) return "https://api.bachs.io";
  return "https://sandbox-api.bachs.io";
}

export function isBachsConfigured(): boolean {
  return Boolean(getBachsApiKey());
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** NGN minimum per Bachs docs */
export const BACHS_NGN_MINIMUM = 1000;
