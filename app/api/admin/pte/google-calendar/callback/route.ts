import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeGoogleCodeForTokens,
  logPteCalendarAudit,
} from "@/lib/google/calendar";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("pte_google_calendar_oauth_state")?.value;

  cookieStore.delete("pte_google_calendar_oauth_state");

  if (error) {
    await logPteCalendarAudit({
      actorEmail: user.email,
      action: "calendar.oauth_failed",
      metadata: { error },
    });
    return NextResponse.redirect(new URL("/admin/pte?calendar=oauth-error", request.url));
  }

  if (!code || !state || state !== expectedState) {
    await logPteCalendarAudit({
      actorEmail: user.email,
      action: "calendar.oauth_state_failed",
    });
    return NextResponse.redirect(new URL("/admin/pte?calendar=state-error", request.url));
  }

  try {
    await exchangeGoogleCodeForTokens(code);
    await logPteCalendarAudit({
      actorEmail: user.email,
      action: "calendar.connected",
    });
    return NextResponse.redirect(new URL("/admin/pte?calendar=connected", request.url));
  } catch (caughtError) {
    await logPteCalendarAudit({
      actorEmail: user.email,
      action: "calendar.oauth_exchange_failed",
      metadata: {
        error: caughtError instanceof Error ? caughtError.message : "Unknown error",
      },
    });
    return NextResponse.redirect(new URL("/admin/pte?calendar=exchange-error", request.url));
  }
}
