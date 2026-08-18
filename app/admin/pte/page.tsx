import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  generatePteFinancialYearStatement,
} from "./actions";
import {
  formatMoney,
  getInvoiceClassOptions,
  hasInvoiceBankDetails,
  type PteInvoice,
} from "./invoice";
import { PteBarChart, PteTrendChart } from "./PteAdminCharts";
import PteLeadsTable, { type PteLeadTableRow } from "./PteLeadsTable";

type PteLead = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  class_type: string;
  class_label: string;
  focus_areas: string[];
  score_goal: string;
  availability: string[];
  followed_up: boolean;
  next_follow_up_at: string | null;
  first_session_booked: boolean;
  first_session_at: string | null;
  payment_received: boolean;
  notes: string;
  pte_invoices?: Array<{ id: string }>;
  pte_bookings?: Array<{
    id: string;
    booking_at: string;
    status: "confirmed" | "cancelled" | "removed";
    notes: string | null;
    interaction_rating: number | null;
    interaction_notes: string | null;
    interaction_rated_at: string | null;
  }>;
};

type LeadMetrics = Pick<
  PteLead,
  | "created_at"
  | "class_type"
  | "focus_areas"
  | "score_goal"
  | "followed_up"
  | "next_follow_up_at"
  | "first_session_booked"
>;

type PteAuditLog = {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  entity_type: "lead" | "invoice" | "statement";
  entity_id: string | null;
  metadata: Record<string, unknown>;
};

const leadPageSize = 8;
const leadStatusFilters = [
  { value: "", label: "All students" },
  { value: "needs-follow-up", label: "Needs follow-up" },
  { value: "followed-up", label: "Followed up" },
  { value: "follow-up-due", label: "Follow-up due" },
  { value: "booked", label: "Booking set" },
  { value: "not-booked", label: "No booking" },
  { value: "paid", label: "Paid" },
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayMs = 24 * 60 * 60 * 1000;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTargetScoreHistogram(leads: PteLead[]) {
  const scores: number[] = [];
  let notSure = 0;

  leads.forEach((lead) => {
    const score = Number(lead.score_goal);

    if (!Number.isInteger(score)) {
      notSure += 1;
      return;
    }

    scores.push(score);
  });

  if (scores.length === 0) {
    return notSure ? [{ label: "Not sure", count: notSure }] : [{ label: "No data", count: 0 }];
  }

  const distinctScores = Array.from(new Set(scores)).sort((a, b) => a - b);
  const histogram =
    distinctScores.length <= 10
      ? distinctScores.map((score) => ({
          label: `${score}`,
          count: scores.filter((value) => value === score).length,
        }))
      : (() => {
          const binSize = 5;
          const minScore = Math.max(10, Math.floor(Math.min(...scores) / binSize) * binSize);
          const maxScore = Math.min(90, Math.ceil(Math.max(...scores) / binSize) * binSize);
          const bins = Array.from({ length: Math.floor((maxScore - minScore) / binSize) + 1 }, (_, index) => {
            const min = minScore + index * binSize;
            const max = Math.min(min + binSize - 1, 90);

            return {
              label: min === max ? `${min}` : `${min}-${max}`,
              min,
              max,
              count: 0,
            };
          });

          scores.forEach((score) => {
            const bin = bins.find((item) => score >= item.min && score <= item.max);
            if (bin) {
              bin.count += 1;
            }
          });

          return bins.map(({ label, count }) => ({ label, count }));
        })();

  return notSure ? [...histogram, { label: "Not sure", count: notSure }] : histogram;
}

function getClassDistribution(leads: PteLead[]) {
  const oneOnOneCount = leads.filter((lead) => lead.class_type === "one-on-one").length;
  const groupCount = leads.filter((lead) => lead.class_type === "group").length;

  return [
    { label: "One-on-one", count: oneOnOneCount },
    { label: "Group", count: groupCount },
  ];
}

function getFocusAreaDistribution(leads: PteLead[]) {
  const counts = new Map<string, number>();

  leads.forEach((lead) => {
    lead.focus_areas.forEach((area) => {
      counts.set(area, (counts.get(area) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label: label
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function getMonthlyLeadCounts(leads: PteLead[], year: number) {
  const counts = monthLabels.map((label) => ({ label, count: 0 }));

  leads.forEach((lead) => {
    const date = new Date(lead.created_at);

    if (date.getFullYear() === year) {
      counts[date.getMonth()].count += 1;
    }
  });

  return counts;
}

function getMonthlyPaidRevenue(invoices: PteInvoice[], year: number) {
  const totals = monthLabels.map((label) => ({ label, amount: 0 }));

  invoices.forEach((invoice) => {
    if (invoice.status !== "paid" || !invoice.paid_at) {
      return;
    }

    const date = new Date(invoice.paid_at);

    if (date.getFullYear() === year) {
      totals[date.getMonth()].amount += Number(invoice.total_amount);
    }
  });

  return totals;
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function getAustralianFinancialYear(now = new Date()) {
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  return {
    label: `FY${String(startYear).slice(2)}-${String(startYear + 1).slice(2)}`,
    start: new Date(startYear, 6, 1),
    end: new Date(startYear + 1, 5, 30, 23, 59, 59, 999),
  };
}

function isDateInRange(value: string | null, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return date >= start && date <= end;
}

function getWeeklyLeadTrend(leads: LeadMetrics[], start: Date, end: Date) {
  const weekCount = Math.max(Math.ceil((end.getTime() - start.getTime()) / (7 * dayMs)), 1);
  const trend = Array.from({ length: weekCount }, (_, index) => {
    const weekStart = new Date(start.getTime() + index * 7 * dayMs);

    return {
      label: formatShortDate(weekStart),
      value: 0,
    };
  });

  leads.forEach((lead) => {
    const createdAt = new Date(lead.created_at);

    if (createdAt < start || createdAt > end) {
      return;
    }

    const index = Math.min(Math.floor((createdAt.getTime() - start.getTime()) / (7 * dayMs)), trend.length - 1);
    trend[index].value += 1;
  });

  return trend;
}

function getWeeklyRevenueTrend(invoices: PteInvoice[], start: Date, end: Date) {
  const weekCount = Math.max(Math.ceil((end.getTime() - start.getTime()) / (7 * dayMs)), 1);
  const trend = Array.from({ length: weekCount }, (_, index) => {
    const weekStart = new Date(start.getTime() + index * 7 * dayMs);

    return {
      label: formatShortDate(weekStart),
      value: 0,
    };
  });

  invoices.forEach((invoice) => {
    if (invoice.status !== "paid" || !invoice.paid_at) {
      return;
    }

    const paidAt = new Date(invoice.paid_at);

    if (paidAt < start || paidAt > end) {
      return;
    }

    const index = Math.min(Math.floor((paidAt.getTime() - start.getTime()) / (7 * dayMs)), trend.length - 1);
    trend[index].value += Number(invoice.total_amount);
  });

  return trend;
}

function getPercent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function cleanSearchValue(value: string) {
  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
}

function buildStatementHref(financialYearStart: Date) {
  const params = new URLSearchParams({
    year: String(financialYearStart.getFullYear()),
  });

  return `/admin/pte/financial-year-statement?${params.toString()}`;
}

function StatCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "danger";
}) {
  const isDanger = tone === "danger";

  return (
    <div className={`border p-4 shadow-sm ${
      isDanger
        ? "border-red-200 bg-red-50 shadow-red-100/60"
        : "border-gray-200 bg-white shadow-gray-100/60"
    }`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${isDanger ? "text-red-700" : "text-mauve-500"}`}>
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${isDanger ? "text-red-700" : "text-blue-900"}`}>{value}</p>
      {helper && <p className={`mt-1 text-sm ${isDanger ? "text-red-700" : "text-gray-500"}`}>{helper}</p>}
    </div>
  );
}

function formatAuditAction(value: string) {
  return value
    .split(".")
    .map((part) =>
      part
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    )
    .join(" · ");
}

export default async function PteAdminPage(props: PageProps<"/admin/pte">) {
  const searchParams = await props.searchParams;
  const rawStudentQuery = getSearchParam(searchParams.student);
  const rawInvoiceQuery = getSearchParam(searchParams.invoice);
  const studentQuery = cleanSearchValue(rawStudentQuery);
  const invoiceQuery = cleanSearchValue(rawInvoiceQuery);
  const hasSearch = Boolean(studentQuery || invoiceQuery);
  const statusFilterValue = cleanSearchValue(getSearchParam(searchParams.status));
  const statusFilter = leadStatusFilters.some((filter) => filter.value === statusFilterValue)
    ? statusFilterValue
    : "";
  const currentPage = Math.max(Number(getSearchParam(searchParams.page)) || 1, 1);
  const pageFrom = (currentPage - 1) * leadPageSize;
  const pageTo = pageFrom + leadPageSize - 1;
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  const { data: matchingInvoiceLeadData, error: matchingInvoiceLeadError } = invoiceQuery
    ? await supabase
        .from("pte_invoices")
        .select("lead_id")
        .ilike("invoice_number", `%${invoiceQuery}%`)
    : { data: null, error: null };

  if (matchingInvoiceLeadError) {
    throw new Error(matchingInvoiceLeadError.message);
  }

  const invoiceLeadIds = Array.from(
    new Set((matchingInvoiceLeadData ?? []).map((invoice) => invoice.lead_id).filter(Boolean)),
  );
  const invoiceSearchHasNoMatches = Boolean(invoiceQuery && invoiceLeadIds.length === 0);

  const { data: leadMetricsData, error: leadMetricsError } = await supabase
    .from("pte_leads")
    .select("created_at,class_type,focus_areas,score_goal,followed_up,next_follow_up_at,first_session_booked")
    .order("created_at", { ascending: false });

  if (leadMetricsError) {
    throw new Error(leadMetricsError.message);
  }

  let leadQuery = supabase
    .from("pte_leads")
    .select("*, pte_invoices(id), pte_bookings(id,booking_at,status,notes,interaction_rating,interaction_notes,interaction_rated_at)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(pageFrom, pageTo);

  if (studentQuery) {
    leadQuery = leadQuery.or(
      `first_name.ilike.%${studentQuery}%,last_name.ilike.%${studentQuery}%,email.ilike.%${studentQuery}%`,
    );
  }

  if (invoiceLeadIds.length > 0) {
    leadQuery = leadQuery.in("id", invoiceLeadIds);
  }

  if (statusFilter === "needs-follow-up") {
    leadQuery = leadQuery.eq("followed_up", false);
  } else if (statusFilter === "followed-up") {
    leadQuery = leadQuery.eq("followed_up", true);
  } else if (statusFilter === "follow-up-due") {
    leadQuery = leadQuery.lte("next_follow_up_at", new Date().toISOString());
  } else if (statusFilter === "booked") {
    leadQuery = leadQuery.eq("first_session_booked", true);
  } else if (statusFilter === "not-booked") {
    leadQuery = leadQuery.eq("first_session_booked", false);
  } else if (statusFilter === "paid") {
    leadQuery = leadQuery.eq("payment_received", true);
  }

  const { data, error, count: visibleLeadCount } = invoiceSearchHasNoMatches
    ? { data: [], error: null, count: 0 }
    : await leadQuery;

  if (error) {
    throw new Error(error.message);
  }

  const { data: invoiceMetricsData, error: invoiceMetricsError } = await supabase
    .from("pte_invoices")
    .select("status,total_amount,paid_at")
    .order("created_at", { ascending: false });

  if (invoiceMetricsError) {
    throw new Error(invoiceMetricsError.message);
  }

  const { data: auditLogData, error: auditLogError } = await supabase
    .from("pte_admin_audit_logs")
    .select("id,created_at,actor_email,action,entity_type,entity_id,metadata")
    .order("created_at", { ascending: false })
    .limit(10);

  if (auditLogError) {
    throw new Error(auditLogError.message);
  }

  const leads = (data ?? []) as PteLead[];
  const allLeadMetrics = (leadMetricsData ?? []) as LeadMetrics[];
  const invoiceMetrics = (invoiceMetricsData ?? []) as PteInvoice[];
  const auditLogs = (auditLogData ?? []) as PteAuditLog[];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const financialYear = getAustralianFinancialYear(now);
  const financialYearToDateEnd = now < financialYear.end ? now : financialYear.end;
  const paidInvoices = invoiceMetrics.filter((invoice) => invoice.status === "paid");
  const sentInvoices = invoiceMetrics.filter((invoice) => invoice.status === "sent");
  const followedUpCount = allLeadMetrics.filter((lead) => lead.followed_up).length;
  const bookedCount = allLeadMetrics.filter((lead) => lead.first_session_booked).length;
  const paidCount = paidInvoices.length;
  const groupCount = allLeadMetrics.filter((lead) => lead.class_type === "group").length;
  const financialYearLeads = allLeadMetrics.filter((lead) =>
    isDateInRange(lead.created_at, financialYear.start, financialYearToDateEnd),
  );
  const financialYearPaidInvoices = paidInvoices.filter((invoice) =>
    isDateInRange(invoice.paid_at, financialYear.start, financialYearToDateEnd),
  );
  const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  const financialYearRevenue = financialYearPaidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_amount),
    0,
  );
  const yearRevenue = paidInvoices.reduce((sum, invoice) => {
    if (!invoice.paid_at || new Date(invoice.paid_at).getFullYear() !== currentYear) {
      return sum;
    }

    return sum + Number(invoice.total_amount);
  }, 0);
  const monthRevenue = paidInvoices.reduce((sum, invoice) => {
    if (!invoice.paid_at) {
      return sum;
    }

    const paidAt = new Date(invoice.paid_at);
    if (paidAt.getFullYear() !== currentYear || paidAt.getMonth() !== currentMonth) {
      return sum;
    }

    return sum + Number(invoice.total_amount);
  }, 0);
  const outstandingRevenue = sentInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_amount),
    0,
  );
  const scoreDistribution = getTargetScoreHistogram(allLeadMetrics as PteLead[]);
  const classDistribution = getClassDistribution(allLeadMetrics as PteLead[]);
  const focusAreaDistribution = getFocusAreaDistribution(allLeadMetrics as PteLead[]);
  const monthlyLeadCounts = getMonthlyLeadCounts(allLeadMetrics as PteLead[], currentYear);
  const monthlyPaidRevenue = getMonthlyPaidRevenue(invoiceMetrics, currentYear);
  const weeklyLeadTrend = getWeeklyLeadTrend(
    allLeadMetrics,
    financialYear.start,
    financialYearToDateEnd,
  );
  const weeklyRevenueTrend = getWeeklyRevenueTrend(
    invoiceMetrics,
    financialYear.start,
    financialYearToDateEnd,
  );
  const leadToBookedPercent = getPercent(bookedCount, allLeadMetrics.length);
  const leadToPaidPercent = getPercent(paidCount, allLeadMetrics.length);
  const invoiceClassOptions = getInvoiceClassOptions();
  const bankDetailsReady = hasInvoiceBankDetails();
  const totalVisibleLeads = visibleLeadCount ?? leads.length;
  const statementHref = buildStatementHref(financialYear.start);
  const tableRows: PteLeadTableRow[] = leads.map((lead) => ({
    ...lead,
  }));

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
          <PhosphorIcon name="arrow-left" size={16} />
          <span>Admin</span>
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-mauve-500">
              PTE admin
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-blue-900">Leads</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enquiries, follow-up state, first-session booking, and payment notes.
            </p>
          </div>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <details className="mt-6 border border-gray-200 bg-white shadow-sm shadow-gray-100/60">
          <summary className="grid cursor-pointer gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Analytics and tax summary</h2>
              <p className="mt-1 text-sm text-gray-500">
                {financialYear.label}: {formatShortDate(financialYear.start)} to {formatShortDate(financialYear.end)}.
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-500">Open dashboard</span>
          </summary>

          <div className="grid gap-4 border-t border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-gray-50 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Formal EOFY statement</p>
                <p className="mt-1 text-sm text-gray-500">
                  Generate a printable summary for paid PTE tutoring invoices in {financialYear.label}.
                </p>
              </div>
              <form action={generatePteFinancialYearStatement}>
                <input type="hidden" name="year" value={financialYear.start.getFullYear()} />
                <noscript>
                  <a href={statementHref}>Generate statement</a>
                </noscript>
                <button type="submit" className="border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2">
                  Generate statement
                </button>
              </form>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="PTE financial year summary">
              <StatCard label="FY revenue" value={formatMoney(financialYearRevenue)} helper="Paid invoices, financial year to date" />
              <StatCard label="FY leads" value={financialYearLeads.length} helper="Created this financial year" />
              <StatCard label="FY paid invoices" value={financialYearPaidInvoices.length} helper="Paid this financial year" />
              <StatCard
                label="Outstanding"
                value={formatMoney(outstandingRevenue)}
                helper="Sent, unpaid invoices"
                tone={outstandingRevenue > 0 ? "danger" : "default"}
              />
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="PTE revenue summary">
              <StatCard label="Revenue earned" value={formatMoney(totalRevenue)} helper="Paid invoices, all time" />
              <StatCard label="Calendar-year revenue" value={formatMoney(yearRevenue)} helper={`Paid invoices in ${currentYear}`} />
              <StatCard label="This month" value={formatMoney(monthRevenue)} helper="Paid invoices this month" />
              <StatCard label="Total leads" value={allLeadMetrics.length} />
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="PTE lead summary">
              <StatCard label="Followed up" value={followedUpCount} />
              <StatCard label="Bookings set" value={bookedCount} helper={`${leadToBookedPercent}% of leads`} />
              <StatCard label="Paid invoices" value={paidCount} helper={`${leadToPaidPercent}% of leads`} />
              <StatCard label="Group leads" value={groupCount} />
              <StatCard label="Visible students" value={totalVisibleLeads} helper={hasSearch ? "Matching current search" : "All students"} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2" aria-label="PTE analytics">
              <PteTrendChart title="Weekly paid revenue" data={weeklyRevenueTrend} valueType="money" />
              <PteTrendChart title="Weekly leads" data={weeklyLeadTrend} />
              <PteBarChart title="Monthly paid revenue" data={monthlyPaidRevenue} valueType="money" />
              <PteBarChart title="Monthly lead volume" data={monthlyLeadCounts} />
              <PteBarChart title="Target score distribution" data={scoreDistribution} xAxisLabel="Target PTE score out of 90" />
              <PteBarChart title="Class type split" data={classDistribution} />
              <div className="lg:col-span-2">
                <PteBarChart title="Improvement area demand" data={focusAreaDistribution.length ? focusAreaDistribution : [{ label: "No data", count: 0 }]} />
              </div>
            </section>

            <details className="border border-gray-200 bg-gray-50">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-gray-900">
                Recent admin activity
              </summary>
              <div className="grid gap-2 border-t border-gray-200 bg-white p-3">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">No audit activity recorded yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="grid gap-1 border border-gray-200 bg-gray-50 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{formatAuditAction(log.action)}</p>
                        <p className="mt-1 text-gray-500">
                          {log.actor_email ?? "Unknown admin"} · {log.entity_type}
                          {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                        </p>
                      </div>
                      <p className="text-gray-500">{formatDateTime(log.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>
        </details>

        <section className="mt-8" aria-label="PTE leads">
          <PteLeadsTable
            initialRows={tableRows}
            initialTotal={totalVisibleLeads}
            invoiceClassOptions={invoiceClassOptions}
            bankDetailsReady={bankDetailsReady}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
