import { formatNaira } from "@/lib/utils";

export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderEmailPayload {
  orderNumber: string;
  orderId: string;
  vendorName: string;
  vendorSlug: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderEmailItem[];
  total: number;
  paymentStatus: string;
  storeUrl?: string;
  dashboardOrdersUrl?: string;
}

function itemsHtml(items: OrderEmailItem[]): string {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(i.name)} × ${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatNaira(i.price * i.quantity)}</td>
        </tr>`
    )
    .join("");
}

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:#0f766e;color:#fff;padding:16px 20px;font-weight:600;font-size:16px;">Kurospace</div>
    <div style="padding:20px;">${body}</div>
    <div style="padding:12px 20px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
      You received this email from Kurospace · Powered by SendLib
    </div>
  </div>
</body>
</html>`;
}

export function vendorNewOrderEmail(p: OrderEmailPayload): { subject: string; html: string; text: string } {
  const subject = `New order ${p.orderNumber} · ${formatNaira(p.total)}`;
  const html = shell(
    subject,
    `
    <h1 style="margin:0 0 8px;font-size:20px;">New order received</h1>
    <p style="margin:0 0 16px;color:#475569;">Someone ordered from <strong>${escapeHtml(p.vendorName)}</strong>.</p>
    <p style="margin:0 0 4px;"><strong>Order:</strong> ${escapeHtml(p.orderNumber)}</p>
    <p style="margin:0 0 4px;"><strong>Customer:</strong> ${escapeHtml(p.customerName)}</p>
    ${p.customerPhone ? `<p style="margin:0 0 4px;"><strong>Phone:</strong> ${escapeHtml(p.customerPhone)}</p>` : ""}
    ${p.customerEmail ? `<p style="margin:0 0 4px;"><strong>Email:</strong> ${escapeHtml(p.customerEmail)}</p>` : ""}
    <p style="margin:0 0 16px;"><strong>Payment:</strong> ${escapeHtml(p.paymentStatus)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #e2e8f0;">Item</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #e2e8f0;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml(p.items)}</tbody>
      <tfoot>
        <tr>
          <td style="padding:12px 8px;font-weight:700;">Total</td>
          <td style="padding:12px 8px;text-align:right;font-weight:700;color:#0f766e;">${formatNaira(p.total)}</td>
        </tr>
      </tfoot>
    </table>
    ${
      p.dashboardOrdersUrl
        ? `<a href="${escapeAttr(p.dashboardOrdersUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">View in dashboard</a>`
        : ""
    }
  `
  );
  const text = `New order ${p.orderNumber} for ${p.vendorName}. Total ${formatNaira(p.total)}. Customer: ${p.customerName} ${p.customerPhone || ""}. Payment: ${p.paymentStatus}.`;
  return { subject, html, text };
}

export function vendorPaymentReceivedEmail(
  p: OrderEmailPayload
): { subject: string; html: string; text: string } {
  const subject = `Payment received · ${p.orderNumber} · ${formatNaira(p.total)}`;
  const html = shell(
    subject,
    `
    <h1 style="margin:0 0 8px;font-size:20px;">Payment confirmed</h1>
    <p style="margin:0 0 16px;color:#475569;">Bachs confirmed payment for order <strong>${escapeHtml(p.orderNumber)}</strong>.</p>
    <p style="margin:0 0 4px;"><strong>Customer:</strong> ${escapeHtml(p.customerName)}</p>
    <p style="margin:0 0 16px;"><strong>Total paid:</strong> <span style="color:#0f766e;font-weight:700;">${formatNaira(p.total)}</span></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
      <tbody>${itemsHtml(p.items)}</tbody>
    </table>
    ${
      p.dashboardOrdersUrl
        ? `<a href="${escapeAttr(p.dashboardOrdersUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">Open orders</a>`
        : ""
    }
  `
  );
  const text = `Payment received for ${p.orderNumber}. Total ${formatNaira(p.total)}. Customer: ${p.customerName}.`;
  return { subject, html, text };
}

export function customerOrderEmail(
  p: OrderEmailPayload
): { subject: string; html: string; text: string } {
  const subject = `Your order ${p.orderNumber} · ${p.vendorName}`;
  const html = shell(
    subject,
    `
    <h1 style="margin:0 0 8px;font-size:20px;">Thanks for your order</h1>
    <p style="margin:0 0 16px;color:#475569;">Hi ${escapeHtml(p.customerName)}, we sent your order to <strong>${escapeHtml(p.vendorName)}</strong>.</p>
    <p style="margin:0 0 4px;"><strong>Order reference:</strong> ${escapeHtml(p.orderNumber)}</p>
    <p style="margin:0 0 16px;"><strong>Payment status:</strong> ${escapeHtml(p.paymentStatus)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
      <tbody>${itemsHtml(p.items)}</tbody>
      <tfoot>
        <tr>
          <td style="padding:12px 8px;font-weight:700;">Total</td>
          <td style="padding:12px 8px;text-align:right;font-weight:700;">${formatNaira(p.total)}</td>
        </tr>
      </tfoot>
    </table>
    ${
      p.storeUrl
        ? `<p style="font-size:14px;"><a href="${escapeAttr(p.storeUrl)}" style="color:#0f766e;">Back to ${escapeHtml(p.vendorName)}</a></p>`
        : ""
    }
  `
  );
  const text = `Thanks ${p.customerName}. Order ${p.orderNumber} with ${p.vendorName}. Total ${formatNaira(p.total)}. Status: ${p.paymentStatus}.`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
