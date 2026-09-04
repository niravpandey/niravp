import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const pageSize = 25;
const allowedStatuses = new Set([
  "needs-follow-up",
  "followed-up",
  "follow-up-due",
  "booked",
  "not-booked",
  "paid",
]);
const allowedSorts = new Set([
  "name",
  "email",
  "created_at",
  "class_label",
  "score_goal",
  "next_follow_up_at",
]);

function cleanSearchValue(value: string | null) {
  return (value ?? "").replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const student = cleanSearchValue(searchParams.get("student"));
  const invoice = cleanSearchValue(searchParams.get("invoice"));
  const status = cleanSearchValue(searchParams.get("status"));
  const sort = cleanSearchValue(searchParams.get("sort"));
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createAdminClient();
  const { data: matchingInvoiceLeadData, error: matchingInvoiceLeadError } = invoice
    ? await supabase
        .from("pte_invoices")
        .select("lead_id")
        .ilike("invoice_number", `%${invoice}%`)
    : { data: null, error: null };

  if (matchingInvoiceLeadError) {
    return NextResponse.json({ error: matchingInvoiceLeadError.message }, { status: 500 });
  }

  const invoiceLeadIds = Array.from(
    new Set((matchingInvoiceLeadData ?? []).map((item) => item.lead_id).filter(Boolean)),
  );

  if (invoice && invoiceLeadIds.length === 0) {
    return NextResponse.json({
      leads: [],
      page,
      pageSize,
      total: 0,
    });
  }

  let query = supabase
    .from("pte_leads")
    .select("*, pte_invoices(id), pte_bookings(id,booking_at,status,notes,meeting_url,google_calendar_event_link,interaction_rating,interaction_notes,interaction_rated_at), pte_booking_requests(id,requested_start_at,duration_minutes,status,student_note)", { count: "exact" })
    .range(from, to);

  if (allowedSorts.has(sort)) {
    if (sort === "name") {
      query = query
        .order("first_name", { ascending: direction === "asc" })
        .order("last_name", { ascending: direction === "asc" });
    } else {
      query = query.order(sort, { ascending: direction === "asc", nullsFirst: false });
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (student) {
    query = query.or(`first_name.ilike.%${student}%,last_name.ilike.%${student}%,email.ilike.%${student}%`);
  }

  if (invoiceLeadIds.length > 0) {
    query = query.in("id", invoiceLeadIds);
  }

  if (allowedStatuses.has(status)) {
    if (status === "needs-follow-up") {
      query = query.eq("followed_up", false);
    } else if (status === "followed-up") {
      query = query.eq("followed_up", true);
    } else if (status === "follow-up-due") {
      query = query.lte("next_follow_up_at", new Date().toISOString());
    } else if (status === "booked") {
      query = query.eq("first_session_booked", true);
    } else if (status === "not-booked") {
      query = query.eq("first_session_booked", false);
    } else if (status === "paid") {
      query = query.eq("payment_received", true);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    leads: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  });
}
