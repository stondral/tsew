import fs from 'fs';
import path from 'path';

/**
 * Reads an email template from the email-templates directory
 * and replaces placeholders with actual values
 */
export function getEmailTemplate(
  templateName:
    | 'welcome-mail'
    | 'forgot-password-mail'
    | 'order-confirmation'
    | 'seller-order-notification'
    | 'low-stock-alert'
    | 'seller-welcome'
    | 'team-invite'
    | 'order-status-update'
    | 'review-confirmation'
    | 'product-submission-admin'
    | 'product-approved'
    | 'product-rejected'
    | 'product-under-review',
  replacements: Record<string, string>
): string {
  const templatePath = path.join(process.cwd(), 'email-templates', `${templateName}.html`);
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace all placeholders like {{username}}, {{verifyUrl}}, etc.
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    template = template.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  return template;
}

interface OrderItem {
  image?: string | null;
  name: string;
  variant?: string | null;
  quantity: number;
  price: number;
}

/**
 * Generates an HTML table row for an order item
 */
export function generateOrderItemRows(items: OrderItem[]): string {
  return items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px;" />` : `<div style="width: 48px; height: 48px; background: #f1f5f9; border-radius: 8px;"></div>`}
          <div>
            <p style="margin: 0; font-weight: 600; color: #0f172a; font-size: 14px;">${item.name}</p>
            ${item.variant ? `<p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Variant: ${item.variant}</p>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-size: 14px;">
        x${item.quantity}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: 600; font-size: 14px;">
        ₹${item.price.toLocaleString()}
      </td>
    </tr>
  `).join('');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

