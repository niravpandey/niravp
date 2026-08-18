import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pte_testimonials")
    .select("id,student_name,testimonial_text,rating,image_storage_path")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ testimonial: data ?? null });
}
