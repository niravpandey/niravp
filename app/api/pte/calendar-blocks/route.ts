import { getPteThisWeekBlockedSlots } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getPteThisWeekBlockedSlots({ allowRefresh: false }));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not load availability blocks.",
        blockedSlots: [],
      },
      { status: 503 },
    );
  }
}
