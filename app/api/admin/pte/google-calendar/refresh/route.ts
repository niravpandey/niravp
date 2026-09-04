import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  logPteCalendarAudit,
  refreshPteBlockedSlots,
} from "@/lib/google/calendar";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const result = await refreshPteBlockedSlots();
    await logPteCalendarAudit({
      actorEmail: user.email,
      action: "calendar.sync_succeeded",
      metadata: {
        blockedSlotCount: result.blockedSlots.length,
        busyRangeCount: result.busyRanges.length,
        calendarErrorCount: Object.keys(result.calendarErrors).length,
      },
    });
    return Response.json(result);
  } catch (error) {
    await logPteCalendarAudit({
      actorEmail: user.email,
      action: "calendar.sync_failed",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not refresh calendar blocks." },
      { status: 500 },
    );
  }
}
