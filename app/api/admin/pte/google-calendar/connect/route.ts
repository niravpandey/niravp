import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createGoogleOAuthState,
  getGoogleAuthorizationUrl,
  logPteCalendarAudit,
} from "@/lib/google/calendar";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const state = createGoogleOAuthState();
  const cookieStore = await cookies();
  cookieStore.set("pte_google_calendar_oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  await logPteCalendarAudit({
    actorEmail: user.email,
    action: "calendar.oauth_started",
  });

  return NextResponse.redirect(getGoogleAuthorizationUrl(state));
}
