import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listGoogleCalendars } from "@/lib/google/calendar";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    return Response.json({ calendars: await listGoogleCalendars() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not list calendars." },
      { status: 500 },
    );
  }
}
