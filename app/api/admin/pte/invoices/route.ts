import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const pageSize = 25;
const allowedStatuses = new Set(["draft", "sent", "paid", "void"]);

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
  const invoice = cleanSearchValue(searchParams.get("invoice"));
  const status = cleanSearchValue(searchParams.get("status"));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createAdminClient();
  let query = supabase
    .from("pte_invoices")
    .select("*, pte_leads(first_name,last_name,email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (invoice) {
    query = query.ilike("invoice_number", `%${invoice}%`);
  }

  if (allowedStatuses.has(status)) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    invoices: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  });
}
