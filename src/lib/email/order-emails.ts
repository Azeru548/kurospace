import { getAppUrl } from "@/lib/bachs/config";
import { sendEmail, isSendLibConfigured } from "./sendlib";
import {
  customerOrderEmail,
  vendorNewOrderEmail,
  vendorPaymentReceivedEmail,
  type OrderEmailPayload,
} from "./templates";

export { isSendLibConfigured };

function withLinks(
  p: Omit<OrderEmailPayload, "storeUrl" | "dashboardOrdersUrl"> & {
    storeUrl?: string;
    dashboardOrdersUrl?: string;
  }
): OrderEmailPayload {
  const app = getAppUrl();
  return {
    ...p,
    storeUrl: p.storeUrl || `${app}/store/${p.vendorSlug}`,
    dashboardOrdersUrl: p.dashboardOrdersUrl || `${app}/dashboard/orders`,
  };
}

/** When customer starts checkout / places order (payment may still be pending). */
export async function emailVendorNewOrder(
  vendorEmail: string | undefined | null,
  payload: Omit<OrderEmailPayload, "storeUrl" | "dashboardOrdersUrl">
) {
  if (!vendorEmail?.trim()) {
    console.warn("[email] vendor has no email — skip new order mail");
    return { ok: false, skipped: true as const };
  }
  const full = withLinks(payload);
  const msg = vendorNewOrderEmail(full);
  return sendEmail({
    to: vendorEmail.trim(),
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  });
}

/** When Bachs webhook confirms payment. */
export async function emailVendorPaymentReceived(
  vendorEmail: string | undefined | null,
  payload: Omit<OrderEmailPayload, "storeUrl" | "dashboardOrdersUrl">
) {
  if (!vendorEmail?.trim()) {
    return { ok: false, skipped: true as const };
  }
  const full = withLinks(payload);
  const msg = vendorPaymentReceivedEmail(full);
  return sendEmail({
    to: vendorEmail.trim(),
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  });
}

/** Optional confirmation to the customer. */
export async function emailCustomerOrder(
  customerEmail: string | undefined | null,
  payload: Omit<OrderEmailPayload, "storeUrl" | "dashboardOrdersUrl">
) {
  if (!customerEmail?.trim()) {
    return { ok: false, skipped: true as const };
  }
  const full = withLinks(payload);
  const msg = customerOrderEmail(full);
  return sendEmail({
    to: customerEmail.trim(),
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  });
}
