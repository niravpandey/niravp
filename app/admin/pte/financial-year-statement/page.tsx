import Link from "next/link";
import { redirect } from "next/navigation";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  formatInvoiceDate,
  formatMoney,
  getInvoiceAbn,
  type PteInvoice,
} from "../invoice";
import StatementPrintButton from "../StatementPrintButton";

const monthLabels = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

type StatementInvoice = PteInvoice & {
  pte_leads?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
};

function getFinancialYearFromSearch(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const year = Number(rawValue);
  const now = new Date();
  const defaultStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  if (!Number.isInteger(year) || year < 2020 || year > defaultStartYear + 1) {
    return defaultStartYear;
  }

  return year;
}

function getFinancialYear(startYear: number) {
  return {
    label: `FY${String(startYear).slice(2)}-${String(startYear + 1).slice(2)}`,
    start: new Date(startYear, 6, 1),
    end: new Date(startYear + 1, 5, 30, 23, 59, 59, 999),
  };
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(value);
}

function getMonthlyTotals(invoices: StatementInvoice[]) {
  const totals = monthLabels.map((label) => ({ label, amount: 0 }));

  invoices.forEach((invoice) => {
    if (!invoice.paid_at) {
      return;
    }

    const paidAt = new Date(invoice.paid_at);
    const monthIndex = (paidAt.getMonth() + 6) % 12;
    totals[monthIndex].amount += Number(invoice.total_amount);
  });

  return totals;
}

function getClassTotals(invoices: StatementInvoice[]) {
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

export default async function PteFinancialYearStatementPage(props: PageProps<"/admin/pte/financial-year-statement">) {
  const searchParams = await props.searchParams;
  const startYear = getFinancialYearFromSearch(searchParams.year);
  const financialYear = getFinancialYear(startYear);
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pte_invoices")
    .select("*, pte_leads(first_name,last_name,email)")
    .eq("status", "paid")
    .gte("paid_at", financialYear.start.toISOString())
    .lte("paid_at", financialYear.end.toISOString())
    .order("paid_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const invoices = (data ?? []) as StatementInvoice[];
  const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  const totalClasses = invoices.reduce((sum, invoice) => sum + invoice.class_count, 0);
  const monthlyTotals = getMonthlyTotals(invoices);
  const classTotals = getClassTotals(invoices);
  const averageInvoice = invoices.length ? totalRevenue / invoices.length : 0;
  const activeMonths = monthlyTotals.filter((item) => item.amount > 0).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 font-sans text-gray-900 print:max-w-none print:px-0 print:py-0">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/pte" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
          <PhosphorIcon name="arrow-left" size={16} />
          <span>PTE admin</span>
        </Link>
        <StatementPrintButton />
      </div>

      <section className="border border-gray-200 bg-white p-8 print:border-0 print:p-0">
        <header className="border-b-2 border-blue-900 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-mauve-500">
            PTE tutoring financial statement
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-blue-900">
            {financialYear.label} income summary
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Reporting period: {formatDate(financialYear.start)} to {formatDate(financialYear.end)}
          </p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Prepared for</h2>
            <p className="mt-2 font-semibold text-gray-900">Nirav Pandey</p>
            <p className="mt-1 text-sm text-gray-600">ABN: {getInvoiceAbn()}</p>
          </div>
          <div className="sm:text-right">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Generated</h2>
            <p className="mt-2 text-sm text-gray-600">{formatDate(new Date())}</p>
            <p className="mt-1 text-sm text-gray-600">Source: paid PTE invoices recorded in admin</p>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Statement summary">
          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gross paid income</p>
            <p className="mt-2 text-2xl font-semibold text-blue-900">{formatMoney(totalRevenue)}</p>
          </div>
          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Paid invoices</p>
            <p className="mt-2 text-2xl font-semibold text-blue-900">{invoices.length}</p>
          </div>
          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Classes invoiced</p>
            <p className="mt-2 text-2xl font-semibold text-blue-900">{totalClasses}</p>
          </div>
          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Average invoice</p>
            <p className="mt-2 text-2xl font-semibold text-blue-900">{formatMoney(averageInvoice)}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Statement details</h2>
            <div className="mt-3 divide-y divide-gray-200 border border-gray-200 text-sm">
              <div className="grid grid-cols-[12rem_1fr] gap-3 px-3 py-2">
                <span className="font-semibold text-gray-700">Paid date range</span>
                <span className="text-gray-600">{getPaidDateRange(invoices)}</span>
              </div>
              <div className="grid grid-cols-[12rem_1fr] gap-3 px-3 py-2">
                <span className="font-semibold text-gray-700">Active months</span>
                <span className="text-gray-600">{activeMonths} of 12</span>
              </div>
              <div className="grid grid-cols-[12rem_1fr] gap-3 px-3 py-2">
                <span className="font-semibold text-gray-700">Currency</span>
                <span className="text-gray-600">AUD</span>
              </div>
              <div className="grid grid-cols-[12rem_1fr] gap-3 px-3 py-2">
                <span className="font-semibold text-gray-700">Accounting basis</span>
                <span className="text-gray-600">Paid invoices recorded in admin</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Income by tutoring type</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-3 py-2 font-semibold text-gray-700">Class type</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Invoices</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Classes</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Paid income</th>
                  </tr>
                </thead>
                <tbody>
                  {classTotals.map((item) => (
                    <tr key={item.label} className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">{item.label}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{item.invoiceCount}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{item.classCount}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatMoney(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Income by month</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  {monthlyTotals.map((item) => (
                    <th key={item.label} className="px-2 py-2 font-semibold text-gray-700">{item.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  {monthlyTotals.map((item) => (
                    <td key={item.label} className="px-2 py-2 text-gray-700">{formatMoney(item.amount)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Paid invoice register</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="px-3 py-2 font-semibold text-gray-700">Invoice</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Paid</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Student</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Service</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Service date</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Rate</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const student = invoice.pte_leads
                    ? `${invoice.pte_leads.first_name} ${invoice.pte_leads.last_name}`
                    : "PTE student";

                  return (
                    <tr key={invoice.id} className="border-b border-gray-200">
                      <td className="px-3 py-2 font-semibold text-blue-900">{invoice.invoice_number}</td>
                      <td className="px-3 py-2 text-gray-700">{formatInvoiceDate(invoice.paid_at)}</td>
                      <td className="px-3 py-2 text-gray-700">{student}</td>
                      <td className="px-3 py-2 text-gray-700">{invoice.class_label}</td>
                      <td className="px-3 py-2 text-gray-700">{formatInvoiceDate(invoice.service_date)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{invoice.class_count}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatMoney(Number(invoice.unit_price))}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatMoney(Number(invoice.total_amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-right font-semibold text-gray-900">Total paid income</td>
                  <td className="px-3 py-3 text-right font-semibold text-blue-900">{formatMoney(totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <p className="mt-8 border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-500">
          This statement summarizes paid invoices recorded in the PTE admin dashboard for business record keeping.
          It does not calculate deductions, GST, PAYG instalments, or tax payable. Confirm tax treatment with your own
          records or a registered tax agent before lodging.
        </p>
      </section>
    </main>
  );
}
