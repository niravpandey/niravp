import "server-only";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  formatInvoiceDate,
  formatMoney,
  getInvoiceAbn,
  getInvoiceBankDetails,
  type PteInvoice,
} from "./invoice";

type StatementInvoice = PteInvoice & {
  pte_leads?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
};

type StatementPdfInput = {
  financialYearLabel: string;
  periodLabel: string;
  invoices: StatementInvoice[];
  generatedAt: Date;
};

const statementMonthLabels = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    color: "#111827",
    fontSize: 10,
    lineHeight: 1.4,
  },
  eyebrow: {
    color: "#826d84",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 6,
    color: "#1e3a8a",
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    color: "#4b5563",
    fontSize: 10,
  },
  section: {
    marginTop: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  box: {
    border: "1 solid #e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 10,
  },
  compactBox: {
    border: "1 solid #e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 8,
  },
  heading: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },
  muted: {
    color: "#4b5563",
  },
  table: {
    marginTop: 8,
    border: "1 solid #e5e7eb",
  },
  noTopTable: {
    border: "1 solid #e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
  },
  tableHeader: {
    backgroundColor: "#f9fafb",
    fontWeight: 700,
  },
  cell: {
    padding: 7,
    flexGrow: 1,
    flexBasis: 0,
  },
  smallCell: {
    padding: 5,
    flexGrow: 1,
    flexBasis: 0,
    fontSize: 8,
  },
  invoiceCell: {
    padding: 6,
    width: 92,
    fontSize: 8,
  },
  dateCell: {
    padding: 6,
    width: 64,
    fontSize: 8,
  },
  serviceCell: {
    padding: 6,
    width: 96,
    fontSize: 8,
  },
  qtyCell: {
    padding: 6,
    width: 30,
    fontSize: 8,
    textAlign: "right",
  },
  rightCell: {
    padding: 7,
    width: 70,
    textAlign: "right",
  },
  smallRightCell: {
    padding: 5,
    width: 62,
    textAlign: "right",
    fontSize: 8,
  },
  strong: {
    fontWeight: 700,
  },
  footer: {
    marginTop: 16,
    paddingTop: 10,
    borderTop: "1 solid #e5e7eb",
    color: "#6b7280",
    fontSize: 9,
  },
});

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(value);
}

function getStatementMonthlyTotals(invoices: StatementInvoice[]) {
  const totals = statementMonthLabels.map((label) => ({ label, amount: 0, count: 0 }));

  invoices.forEach((invoice) => {
    if (!invoice.paid_at) {
      return;
    }

    const paidAt = new Date(invoice.paid_at);
    const monthIndex = (paidAt.getMonth() + 6) % 12;
    totals[monthIndex].amount += Number(invoice.total_amount);
    totals[monthIndex].count += 1;
  });

  return totals;
}

function getStatementClassTotals(invoices: StatementInvoice[]) {
  const totals = new Map<string, { classCount: number; invoiceCount: number; amount: number }>();

  invoices.forEach((invoice) => {
    const current = totals.get(invoice.class_label) ?? { classCount: 0, invoiceCount: 0, amount: 0 };

    totals.set(invoice.class_label, {
      classCount: current.classCount + invoice.class_count,
      invoiceCount: current.invoiceCount + 1,
      amount: current.amount + Number(invoice.total_amount),
    });
  });

  return Array.from(totals.entries()).map(([label, value]) => ({
    label,
    ...value,
  }));
}

function getPaidDateRange(invoices: StatementInvoice[]) {
  const timestamps = invoices
    .map((invoice) => (invoice.paid_at ? new Date(invoice.paid_at).getTime() : null))
    .filter((value): value is number => value !== null);

  if (timestamps.length === 0) {
    return "No paid invoices recorded";
  }

  return `${formatDate(new Date(Math.min(...timestamps)))} to ${formatDate(new Date(Math.max(...timestamps)))}`;
}

export async function renderInvoicePdfBuffer(invoice: PteInvoice) {
  const lead = invoice.pte_leads;
  const bank = getInvoiceBankDetails();
  const recipientName = lead ? `${lead.first_name} ${lead.last_name}` : "PTE student";

  return renderToBuffer(
    <Document title={`Invoice ${invoice.invoice_number}`} author="Nirav Pandey">
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>PTE tutoring invoice</Text>
        <Text style={styles.title}>Invoice {invoice.invoice_number}</Text>

        <View style={[styles.section, styles.row]}>
          <View>
            <Text style={styles.heading}>From</Text>
            <Text>Nirav Pandey</Text>
            <Text>ABN: {getInvoiceAbn()}</Text>
          </View>
          <View>
            <Text style={styles.heading}>To</Text>
            <Text>{recipientName}</Text>
            {lead?.email && <Text>{lead.email}</Text>}
          </View>
        </View>

        <View style={[styles.section, styles.table]}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.cell}>Description</Text>
            <Text style={styles.rightCell}>Qty</Text>
            <Text style={styles.rightCell}>Rate</Text>
            <Text style={styles.rightCell}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cell}>{invoice.class_label}</Text>
            <Text style={styles.rightCell}>{invoice.class_count}</Text>
            <Text style={styles.rightCell}>{formatMoney(Number(invoice.unit_price))}</Text>
            <Text style={styles.rightCell}>{formatMoney(Number(invoice.total_amount))}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cell}>Total due</Text>
            <Text style={styles.rightCell}></Text>
            <Text style={styles.rightCell}></Text>
            <Text style={styles.rightCell}>{formatMoney(Number(invoice.total_amount))}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.box]}>
          <Text style={styles.heading}>Payment details</Text>
          <Text>Account name: {bank.accountName}</Text>
          <Text>BSB: {bank.bsb}</Text>
          <Text>Account number: {bank.accountNumber}</Text>
          <Text>Reference: {invoice.invoice_number}</Text>
        </View>

        <View style={styles.section}>
          <Text>Service date: {formatInvoiceDate(invoice.service_date)}</Text>
          <Text>Due date: {formatInvoiceDate(invoice.due_date)}</Text>
          {invoice.notes && <Text style={styles.muted}>Notes: {invoice.notes}</Text>}
        </View>
      </Page>
    </Document>,
  );
}

export async function renderFinancialYearStatementPdfBuffer({
  financialYearLabel,
  periodLabel,
  invoices,
  generatedAt,
}: StatementPdfInput) {
  const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  const classCount = invoices.reduce((sum, invoice) => sum + invoice.class_count, 0);
  const averageInvoice = invoices.length ? total / invoices.length : 0;
  const monthlyTotals = getStatementMonthlyTotals(invoices);
  const activeMonths = monthlyTotals.filter((month) => month.amount > 0).length;
  const classTotals = getStatementClassTotals(invoices);
  const generatedLabel = formatDate(generatedAt);

  return renderToBuffer(
    <Document title={`${financialYearLabel} PTE income statement`} author="Nirav Pandey">
      <Page size="A4" style={styles.page}>
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <View>
            <Text style={styles.eyebrow}>PTE tutoring financial statement</Text>
            <Text style={styles.title}>{financialYearLabel} income summary</Text>
            <Text style={styles.subtitle}>Period: {periodLabel}</Text>
            <Text style={styles.subtitle}>Generated: {generatedLabel}</Text>
          </View>
          <View style={[styles.compactBox, { width: 170 }]}>
            <Text style={styles.eyebrow}>Prepared for</Text>
            <Text style={[styles.heading, { marginTop: 4, marginBottom: 2 }]}>Nirav Pandey</Text>
            <Text style={styles.muted}>ABN: {getInvoiceAbn()}</Text>
            <Text style={styles.muted}>Currency: AUD</Text>
            <Text style={styles.muted}>Basis: paid invoices</Text>
          </View>
        </View>

        <View style={[styles.section, styles.row]}>
          <View style={[styles.box, { width: "24%" }]}>
            <Text style={styles.eyebrow}>Gross paid income</Text>
            <Text style={styles.heading}>{formatMoney(total)}</Text>
          </View>
          <View style={[styles.box, { width: "24%" }]}>
            <Text style={styles.eyebrow}>Paid invoices</Text>
            <Text style={styles.heading}>{invoices.length}</Text>
          </View>
          <View style={[styles.box, { width: "24%" }]}>
            <Text style={styles.eyebrow}>Classes invoiced</Text>
            <Text style={styles.heading}>{classCount}</Text>
          </View>
          <View style={[styles.box, { width: "24%" }]}>
            <Text style={styles.eyebrow}>Average invoice</Text>
            <Text style={styles.heading}>{formatMoney(averageInvoice)}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.row]}>
          <View style={{ width: "49%" }}>
            <Text style={styles.heading}>Statement details</Text>
            <View style={styles.noTopTable}>
              <View style={styles.tableRow}>
                <Text style={styles.smallCell}>Paid date range</Text>
                <Text style={styles.smallCell}>{getPaidDateRange(invoices)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.smallCell}>Active paid months</Text>
                <Text style={styles.smallCell}>{activeMonths} of 12</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.smallCell}>Source system</Text>
                <Text style={styles.smallCell}>PTE admin paid invoice register</Text>
              </View>
            </View>
          </View>
          <View style={{ width: "49%" }}>
            <Text style={styles.heading}>Income by tutoring type</Text>
            <View style={styles.noTopTable}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.smallCell}>Type</Text>
                <Text style={styles.smallRightCell}>Invoices</Text>
                <Text style={styles.smallRightCell}>Classes</Text>
                <Text style={styles.smallRightCell}>Income</Text>
              </View>
              {classTotals.length === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={styles.smallCell}>No paid invoices</Text>
                </View>
              ) : (
                classTotals.map((item) => (
                  <View key={item.label} style={styles.tableRow}>
                    <Text style={styles.smallCell}>{item.label}</Text>
                    <Text style={styles.smallRightCell}>{item.invoiceCount}</Text>
                    <Text style={styles.smallRightCell}>{item.classCount}</Text>
                    <Text style={styles.smallRightCell}>{formatMoney(item.amount)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Income by month</Text>
          <View style={styles.noTopTable}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              {monthlyTotals.map((month) => (
                <Text key={month.label} style={[styles.smallCell, { textAlign: "center" }]}>
                  {month.label}
                </Text>
              ))}
            </View>
            <View style={styles.tableRow}>
              {monthlyTotals.map((month) => (
                <Text key={month.label} style={[styles.smallCell, { textAlign: "center" }]}>
                  {formatMoney(month.amount)}
                </Text>
              ))}
            </View>
            <View style={styles.tableRow}>
              {monthlyTotals.map((month) => (
                <Text key={month.label} style={[styles.smallCell, { textAlign: "center" }]}>
                  {month.count} inv.
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.table]}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.invoiceCell}>Invoice</Text>
            <Text style={styles.dateCell}>Paid</Text>
            <Text style={styles.smallCell}>Student</Text>
            <Text style={styles.serviceCell}>Service</Text>
            <Text style={styles.dateCell}>Service date</Text>
            <Text style={styles.qtyCell}>Qty</Text>
            <Text style={styles.smallRightCell}>Rate</Text>
            <Text style={styles.smallRightCell}>Amount</Text>
          </View>
          {invoices.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.cell}>No paid invoices recorded for this financial year.</Text>
            </View>
          ) : invoices.map((invoice) => {
            const student = invoice.pte_leads
              ? `${invoice.pte_leads.first_name} ${invoice.pte_leads.last_name}`
              : "PTE student";

            return (
              <View key={invoice.id} style={styles.tableRow}>
                <Text style={styles.invoiceCell}>{invoice.invoice_number}</Text>
                <Text style={styles.dateCell}>{formatInvoiceDate(invoice.paid_at)}</Text>
                <Text style={styles.smallCell}>{student}</Text>
                <Text style={styles.serviceCell}>{invoice.class_label}</Text>
                <Text style={styles.dateCell}>{formatInvoiceDate(invoice.service_date)}</Text>
                <Text style={styles.qtyCell}>{invoice.class_count}</Text>
                <Text style={styles.smallRightCell}>{formatMoney(Number(invoice.unit_price))}</Text>
                <Text style={styles.smallRightCell}>{formatMoney(Number(invoice.total_amount))}</Text>
              </View>
            );
          })}
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.strong]}>Total paid income</Text>
            <Text style={[styles.rightCell, styles.strong]}>{formatMoney(total)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This statement summarizes paid PTE tutoring invoices recorded in the admin dashboard for business record
          keeping. It does not calculate deductions, GST, PAYG instalments, or tax payable. Confirm tax treatment with
          your own records or a registered tax agent before lodging.
        </Text>
      </Page>
    </Document>,
  );
}
