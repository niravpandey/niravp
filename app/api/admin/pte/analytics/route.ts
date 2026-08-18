import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getAustralianFinancialYear(now = new Date()) {
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  return {
    label: `FY${String(startYear).slice(2)}-${String(startYear + 1).slice(2)}`,
    start: new Date(startYear, 6, 1),
    end: new Date(startYear + 1, 5, 30, 23, 59, 59, 999),
  };
}

export async function GET() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const financialYear = getAustralianFinancialYear();
  const [{ data: leads, error: leadError }, { data: invoices, error: invoiceError }] = await Promise.all([
    supabase
      .from("pte_leads")
      .select("created_at,class_type,focus_areas,score_goal,followed_up,next_follow_up_at,first_session_booked,payment_received"),
    supabase
      .from("pte_invoices")
      .select("created_at,status,total_amount,paid_at,class_type,class_label,class_count"),
  ]);

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  }

  const paidInvoices = (invoices ?? []).filter((invoice) => invoice.status === "paid");
  const financialYearRevenue = paidInvoices.reduce((sum, invoice) => {
    if (!invoice.paid_at) {
      return sum;
    }

    const paidAt = new Date(invoice.paid_at);
    if (paidAt < financialYear.start || paidAt > financialYear.end) {
      return sum;
    }

    return sum + Number(invoice.total_amount);
  }, 0);

  return NextResponse.json({
    financialYear,
    totals: {
      leads: leads?.length ?? 0,
      paidInvoices: paidInvoices.length,
      financialYearRevenue,
    },
    leads: leads ?? [],
    invoices: invoices ?? [],
  });
}
