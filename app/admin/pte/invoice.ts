import { classTypes, formatClassPrice, getClassTypeByValue } from "@/app/pte/components/pteContent";

export type PteInvoiceLead = {
  first_name: string;
  last_name: string;
  email: string;
};

export type PteInvoice = {
  id: string;
  lead_id: string;
  invoice_number: string;
  created_at: string;
  sent_at: string | null;
  paid_at: string | null;
  status: "draft" | "sent" | "paid" | "void";
  class_type: string;
  class_label: string;
  class_count: number;
  unit_price: number;
  total_amount: number;
  currency: "AUD";
  due_date: string | null;
  service_date: string | null;
  notes: string;
  emailed_to: string | null;
  pdf_storage_path?: string | null;
  pdf_generated_at?: string | null;
  pte_leads?: PteInvoiceLead | null;
};

type InvoiceBankDetails = {
  accountName: string;
  bsb: string;
  accountNumber: string;
};

export function getInvoiceBankDetails(): InvoiceBankDetails {
  return {
    accountName: process.env.PTE_INVOICE_ACCOUNT_NAME ?? "",
    bsb: process.env.PTE_INVOICE_BSB ?? "",
    accountNumber: process.env.PTE_INVOICE_ACCOUNT_NUMBER ?? "",
  };
}

export function getInvoiceAbn() {
  return process.env.PTE_INVOICE_ABN ?? "68 747 605 307";
}

export function hasInvoiceBankDetails() {
  const details = getInvoiceBankDetails();
  return Boolean(details.accountName && details.bsb && details.accountNumber);
}

export function getClassUnitPrice(classType: string) {
  return getClassTypeByValue(classType)?.price ?? 0;
}

export function getClassLabel(classType: string) {
  const classTypeMeta = getClassTypeByValue(classType);

  if (!classTypeMeta) {
    return classType;
  }

  return `${classTypeMeta.label} tutoring`;
}

export function getInvoiceClassOptions() {
  return classTypes.map((classType) => ({
    value: classType.value,
    label: classType.label,
    price: classType.price,
    priceLabel: formatClassPrice(classType.price),
  }));
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export function formatInvoiceDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderInvoiceHtml(invoice: PteInvoice) {
  const lead = invoice.pte_leads;
  const bank = getInvoiceBankDetails();
  const abn = getInvoiceAbn();
  const recipientName = lead ? `${lead.first_name} ${lead.last_name}` : "PTE student";
  const total = formatMoney(Number(invoice.total_amount));

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5; max-width: 680px; margin: 0 auto;">
      <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; color: #826d84; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">PTE tutoring invoice</p>
        <h1 style="margin: 0; color: #1e3a8a; font-size: 28px;">Invoice ${escapeHtml(invoice.invoice_number)}</h1>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="vertical-align: top; padding-right: 16px;">
            <p style="margin: 0; font-weight: 700;">From</p>
            <p style="margin: 4px 0 0;">Nirav Pandey</p>
            <p style="margin: 4px 0 0;">ABN: ${escapeHtml(abn)}</p>
          </td>
          <td style="vertical-align: top;">
            <p style="margin: 0; font-weight: 700;">To</p>
            <p style="margin: 4px 0 0;">${escapeHtml(recipientName)}</p>
            ${lead?.email ? `<p style="margin: 4px 0 0;">${escapeHtml(lead.email)}</p>` : ""}
          </td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb;">Description</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e5e7eb;">Qty</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e5e7eb;">Rate</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px;">${escapeHtml(invoice.class_label)}</td>
            <td style="text-align: right; padding: 10px;">${invoice.class_count}</td>
            <td style="text-align: right; padding: 10px;">${formatMoney(Number(invoice.unit_price))}</td>
            <td style="text-align: right; padding: 10px;">${total}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px; border-top: 1px solid #e5e7eb; font-weight: 700;">Total due</td>
            <td style="text-align: right; padding: 10px; border-top: 1px solid #e5e7eb; font-weight: 700;">${total}</td>
          </tr>
        </tfoot>
      </table>

      <div style="border: 1px solid #e5e7eb; background: #f9fafb; padding: 14px; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 700;">Payment details</p>
        <p style="margin: 6px 0 0;">Account name: ${escapeHtml(bank.accountName)}</p>
        <p style="margin: 4px 0 0;">BSB: ${escapeHtml(bank.bsb)}</p>
        <p style="margin: 4px 0 0;">Account number: ${escapeHtml(bank.accountNumber)}</p>
        <p style="margin: 4px 0 0;">Reference: ${escapeHtml(invoice.invoice_number)}</p>
      </div>

      <p style="margin: 0;">Service date: ${escapeHtml(formatInvoiceDate(invoice.service_date))}</p>
      <p style="margin: 4px 0 0;">Due date: ${escapeHtml(formatInvoiceDate(invoice.due_date))}</p>
      ${invoice.notes ? `<p style="margin: 16px 0 0; color: #4b5563;">${escapeHtml(invoice.notes)}</p>` : ""}
    </div>
  `;
}

export function renderInvoiceText(invoice: PteInvoice) {
  const lead = invoice.pte_leads;
  const bank = getInvoiceBankDetails();
  const recipientName = lead ? `${lead.first_name} ${lead.last_name}` : "PTE student";

  return [
    `Invoice ${invoice.invoice_number}`,
    "",
    "From: Nirav Pandey",
    `ABN: ${getInvoiceAbn()}`,
    `To: ${recipientName}`,
    lead?.email ? `Email: ${lead.email}` : "",
    "",
    `${invoice.class_label}`,
    `Classes: ${invoice.class_count}`,
    `Rate: ${formatMoney(Number(invoice.unit_price))}`,
    `Total due: ${formatMoney(Number(invoice.total_amount))}`,
    "",
    "Payment details",
    `Account name: ${bank.accountName}`,
    `BSB: ${bank.bsb}`,
    `Account number: ${bank.accountNumber}`,
    `Reference: ${invoice.invoice_number}`,
    "",
    `Service date: ${formatInvoiceDate(invoice.service_date)}`,
    `Due date: ${formatInvoiceDate(invoice.due_date)}`,
    invoice.notes ? `Notes: ${invoice.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
