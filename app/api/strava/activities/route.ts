// app/api/strava/activities/route.ts
import { NextResponse } from "next/server";
import { addWeeks, startOfWeek, formatISO, subWeeks } from "date-fns";

type StravaActivity = {
  athlete: { id: number; resource_state: number };
  name: string;
  distance: number;               // meters (float, e.g. 3306.5)
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type?: string;
  workout_type?: number | null;
  id: number;                     // large numeric id
  start_date: string;             // UTC ISO string, e.g. "2025-11-20T22:08:43Z"
  start_date_local: string;       // local ISO string, e.g. "2025-11-21T09:08:43Z"
  timezone?: string;
  utc_offset?: number;
  achievement_count?: number;
  average_speed?: number;
  max_speed?: number;
  elev_high?: number;
  elev_low?: number;
};

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    client_secret: process.env.STRAVA_CLIENT_SECRET ?? "",
    refresh_token: process.env.STRAVA_REFRESH_TOKEN ?? "",
    grant_type: "refresh_token",
  });

  const res = await fetch(STRAVA_TOKEN_URL, { method: "POST", body });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Strava token refresh failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function fetchAllActivities(accessToken: string) {
  const perPage = 200;
  let page = 1;
  let all: StravaActivity[] = [];

  while (true) {
    const url = `${STRAVA_ACTIVITIES_URL}?per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Strava activities fetch failed: ${res.status} ${txt}`);
    }
    const pageData = (await res.json()) as StravaActivity[];
    if (!Array.isArray(pageData) || pageData.length === 0) break;
    all = all.concat(pageData);
    if (pageData.length < perPage) break;
    page++;
  }
  return all;
}

function aggregateWeeklyDistances(activities: StravaActivity[], weeks = 12) {
  const now = new Date();
  const weekStart = (d: Date) => startOfWeek(d, { weekStartsOn: 1 }); // Monday

  const result: { weekStartISO: string; totalDistanceKm: number; activitiesCount: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const wStart = weekStart(subWeeks(now, i));
    const wEnd = addWeeks(wStart, 1);
    const weekActivities = activities.filter((a) => {
      // use UTC `start_date` to decide week membership (consistent)
      const d = new Date(a.start_date);
      return d >= wStart && d < wEnd;
    });

    // distance is a float in meters (e.g. 3306.5), sum and convert to km
    const totalMeters = weekActivities.reduce((s, a) => s + (Number(a.distance) || 0), 0);
    result.push({
      weekStartISO: formatISO(wStart, { representation: "date" }), // YYYY-MM-DD
      totalDistanceKm: Number((totalMeters / 1000).toFixed(2)),
      activitiesCount: weekActivities.length,
    });
  }

  return result;
}

export async function GET() {
  try {
    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET || !process.env.STRAVA_REFRESH_TOKEN) {
      return NextResponse.json({ error: "Missing STRAVA_ env vars" }, { status: 500 });
    }

    const tokenJson = await getAccessToken();
    const accessToken: string = tokenJson.access_token;
    if (!accessToken) throw new Error("No access_token in Strava response");

    const activities = await fetchAllActivities(accessToken);
    const weeks = Number(process.env.STRAVA_WEEKS ?? 12);
    const aggregated = aggregateWeeklyDistances(activities, weeks);

    return NextResponse.json({
      meta: { fetchedAt: new Date().toISOString(), totalActivities: activities.length },
      aggregated,
      // raw: activities.slice(0, 200) // uncomment to return sample raw activities if desired
    });
  } catch (err: any) {
    console.error("Strava API error", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
