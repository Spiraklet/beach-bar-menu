import { Resend } from 'resend'

const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@example.com'

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(key)
}

interface OrderItem {
  itemNameSnapshot: string
  itemPriceSnapshot: number | { toString(): string }
  quantity: number
  customizations: unknown
  subtotal: number | { toString(): string }
  note?: string | null
}

interface OrderForEmail {
  displayCode: string
  status: string
  total: number | { toString(): string }
  customerNote?: string | null
  createdAt: Date
  client: { companyName: string }
  qrCode: { tableIdentifier: string }
  items: OrderItem[]
}

export async function sendOrderConfirmation(to: string, order: OrderForEmail) {
  const itemsHtml = order.items
    .map((item) => {
      const customizations = Array.isArray(item.customizations)
        ? (item.customizations as Array<{ name: string }>)
            .map((c) => c.name)
            .join(', ')
        : ''

      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">
            <strong>${item.itemNameSnapshot}</strong>
            ${customizations ? `<br><span style="font-size:12px;color:#666;">${customizations}</span>` : ''}
            ${item.note ? `<br><span style="font-size:11px;color:#d97706;font-style:italic;">📝 ${item.note}</span>` : ''}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align:center;">x${item.quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align:right;">€${Number(item.subtotal).toFixed(2)}</td>
        </tr>
      `
    })
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:#0ea5e9;padding:32px 24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">Order Confirmed!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${order.client.companyName}</p>
        </div>

        <!-- Order Info -->
        <div style="padding:24px;">
          <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Order Number</p>
            <p style="margin:0;font-size:28px;font-weight:bold;color:#0ea5e9;">#${order.displayCode}</p>
            <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Table ${order.qrCode.tableIdentifier}</p>
          </div>

          <!-- Items Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px 12px;text-align:left;font-size:13px;color:#64748b;font-weight:600;">Item</th>
                <th style="padding:8px 12px;text-align:center;font-size:13px;color:#64748b;font-weight:600;">Qty</th>
                <th style="padding:8px 12px;text-align:right;font-size:13px;color:#64748b;font-weight:600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Total -->
          <div style="border-top:2px solid #e2e8f0;padding-top:12px;text-align:right;">
            <span style="font-size:16px;font-weight:bold;color:#1e293b;">Total: €${Number(order.total).toFixed(2)}</span>
          </div>

          ${order.customerNote ? `
          <div style="margin-top:20px;padding:12px;background:#fffbeb;border-radius:8px;border-left:3px solid #f59e0b;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#92400e;">Your Note</p>
            <p style="margin:0;font-size:14px;color:#78350f;">${order.customerNote}</p>
          </div>
          ` : ''}

          <p style="margin:24px 0 0;font-size:13px;color:#64748b;text-align:center;">
            Thank you for your order! We'll have it ready for you shortly.
          </p>
        </div>

      </div>
    </body>
    </html>
  `

  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Order Confirmation #${order.displayCode} — ${order.client.companyName}`,
    html,
  })
}
