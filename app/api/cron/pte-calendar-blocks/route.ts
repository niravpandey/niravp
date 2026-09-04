import type { NextRequest } from "next/server";
import {
  logPteCalendarAudit,
  refreshPteBlockedSlots,
} from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshPteBlockedSlots();
    await logPteCalendarAudit({
      action: "calendar.cron_sync_succeeded",
      metadata: {
        blockedSlotCount: result.blockedSlots.length,
        busyRangeCount: result.busyRanges.length,
        calendarErrorCount: Object.keys(result.calendarErrors).length,
      },
    });

    return Response.json({
      ok: true,
      blockedSlotCount: result.blockedSlots.length,
      fetchedAt: result.fetchedAt,
    });
  } catch (error) {
    await logPteCalendarAudit({
      action: "calendar.cron_sync_failed",
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
