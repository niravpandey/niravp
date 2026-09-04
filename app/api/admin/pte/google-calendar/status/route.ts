import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPteCalendarConnection } from "@/lib/google/calendar";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return Response.json({ connection: await getPteCalendarConnection() });
}
