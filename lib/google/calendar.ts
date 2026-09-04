import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleCalendarApiBase = "https://www.googleapis.com/calendar/v3";
const calendarScopes = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];
const defaultConnectionId = "default";
const cacheFreshMs = 5 * 60 * 1000;

export type PteCalendarConnection = {
  connected_email: string | null;
  granted_scopes: string[];
  calendar_ids: Record<string, string>;
  last_sync_at: string | null;
  last_error: string | null;
  has_refresh_token: boolean;
};

export type PteCalendarListItem = {
  id: string;
  summary: string;
  accessRole: string;
  primary?: boolean;
};

export type PteBusyRange = {
  calendarId: string;
  calendarRole: string;
  start: string;
  end: string;
};

export type PteBlockedSlot = {
  date: string;
  day: string;
  time: string;
  value: string;
  calendarIds: string[];
};

type StoredCalendarConnection = {
  connected_email: string | null;
  refresh_token: string | null;
  granted_scopes: string[] | null;
  calendar_ids: Record<string, string> | null;
  last_sync_at: string | null;
  last_error: string | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleCalendarListResponse = {
  items?: PteCalendarListItem[];
  error?: { message?: string };
};

type GoogleFreeBusyResponse = {
  calendars?: Record<
    string,
    {
      busy?: Array<{ start: string; end: string }>;
      errors?: Array<{ domain?: string; reason?: string }>;
    }
  >;
  error?: { message?: string };
};

type GoogleEventResponse = {
  id?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
  error?: { message?: string };
};

export function getPteCalendarTimeZone() {
  return process.env.GOOGLE_CALENDAR_TIMEZONE || "Australia/Melbourne";
}

export function createGoogleOAuthState() {
  return crypto.randomBytes(32).toString("hex");
}

export function getGoogleAuthorizationUrl(state: string) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const redirectUri = getGoogleRedirectUri();

  if (!clientId || !redirectUri) {
    throw new Error("Missing Google Calendar OAuth environment variables.");
  }

  const params = new URLSearchParams({
    access_type: "offline",
    client_id: clientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: calendarScopes.join(" "),
    state,
  });

  return `${googleAuthUrl}?${params.toString()}`;
}

export async function getPteCalendarConnection(): Promise<PteCalendarConnection | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pte_google_calendar_connection")
    .select("connected_email,refresh_token,granted_scopes,calendar_ids,last_sync_at,last_error")
    .eq("id", defaultConnectionId)
    .maybeSingle<StoredCalendarConnection>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    connected_email: data.connected_email,
    granted_scopes: data.granted_scopes ?? [],
    calendar_ids: data.calendar_ids ?? {},
    last_sync_at: data.last_sync_at,
    last_error: data.last_error,
    has_refresh_token: Boolean(data.refresh_token),
  };
}

export async function exchangeGoogleCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUri = getGoogleRedirectUri();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google Calendar OAuth environment variables.");
  }

  const response = await fetchGoogleToken({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  if (!response.refresh_token) {
    const existing = await getStoredCalendarConnection();

    if (!existing?.refresh_token) {
      throw new Error("Google did not return a refresh token. Reconnect with consent.");
    }
  }

  const existing = await getStoredCalendarConnection();
  const refreshToken = response.refresh_token ?? existing?.refresh_token;

  if (!refreshToken) {
    throw new Error("Missing Google refresh token.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("pte_google_calendar_connection").upsert({
    id: defaultConnectionId,
    refresh_token: refreshToken,
    granted_scopes: response.scope?.split(" ").filter(Boolean) ?? [],
    last_error: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listGoogleCalendars() {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`${googleCalendarApiBase}/users/me/calendarList?maxResults=250`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = (await response.json()) as GoogleCalendarListResponse;

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Could not list Google calendars.");
  }

  return (body.items ?? []).map((calendar) => ({
    id: calendar.id,
    summary: calendar.summary,
    accessRole: calendar.accessRole,
    primary: calendar.primary,
  }));
}

export async function getPteBlockedSlots({ forceRefresh = false } = {}) {
  const cached = forceRefresh ? null : await getFreshBlockedSlotCache();

  if (cached) {
    return cached;
  }

  return refreshPteBlockedSlots();
}

export async function getPteThisWeekBlockedSlots({
  allowRefresh = true,
}: {
  allowRefresh?: boolean;
} = {}) {
  const result = allowRefresh
    ? await getPteBlockedSlots()
    : await getCachedPteBlockedSlots();
  const timeZone = result.timeZone || getPteCalendarTimeZone();
  const window = getPteThisWeekWindow();
  const blockedSlots = (result.blockedSlots ?? []).filter((slot) => {
    const slotDate = new Date(`${slot.date}T00:00:00`);
    return slotDate.getTime() >= getLocalDateOnly(window.start, timeZone).getTime()
      && slotDate.getTime() < getLocalDateOnly(window.end, timeZone).getTime();
  });

  return {
    ...result,
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    weekDays: getWeekDayLabels(window.start, timeZone),
    blockedSlots,
  };
}

export async function getCachedPteBlockedSlots() {
  const cached = await getBlockedSlotCache();

  if (cached) {
    return cached;
  }

  const timeZone = getPteCalendarTimeZone();
  const window = getPteCalendarWindow();

  return {
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    timeZone,
    busyRanges: [],
    blockedSlots: [],
    calendarErrors: {},
    fetchedAt: null,
    stale: true,
  };
}

export async function refreshPteBlockedSlots() {
  const timeZone = getPteCalendarTimeZone();
  const window = getPteCalendarWindow();
  const calendarEntries = await getBlockingCalendarEntries();
  const calendarIds = calendarEntries.map((entry) => entry.id);

  if (calendarIds.length === 0) {
    throw new Error("No Google blocking calendars are configured.");
  }

  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`${googleCalendarApiBase}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: window.start.toISOString(),
      timeMax: window.end.toISOString(),
      timeZone,
      calendarExpansionMax: 50,
      items: calendarIds.map((id) => ({ id })),
    }),
  });
  const body = (await response.json()) as GoogleFreeBusyResponse;

  if (!response.ok) {
    await recordCalendarSyncError(body.error?.message ?? "Could not fetch Google FreeBusy data.");
    throw new Error(body.error?.message ?? "Could not fetch Google FreeBusy data.");
  }

  const { busyRanges, calendarErrors } = flattenBusyResponse(body, getCalendarRoleById(calendarEntries));
  const blockedSlots = busyRangesToBlockedSlots(busyRanges, window.start, window.end, timeZone);
  const fetchedAt = new Date().toISOString();
  const supabase = createAdminClient();
  const { error } = await supabase.from("pte_google_calendar_block_cache").upsert({
    id: defaultConnectionId,
    window_start: window.start.toISOString(),
    window_end: window.end.toISOString(),
    time_zone: timeZone,
    busy_ranges: busyRanges,
    blocked_slots: blockedSlots,
    calendar_errors: calendarErrors,
    fetched_at: fetchedAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("pte_google_calendar_connection").upsert({
    id: defaultConnectionId,
    last_sync_at: fetchedAt,
    last_error: Object.keys(calendarErrors).length ? "One or more calendars returned errors." : null,
  });

  return {
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    timeZone,
    busyRanges,
    blockedSlots,
    calendarErrors,
    fetchedAt,
    stale: false,
  };
}

export async function logPteCalendarAudit({
  actorEmail,
  action,
  metadata = {},
}: {
  actorEmail?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("pte_admin_audit_logs").insert({
    actor_email: actorEmail?.toLowerCase() ?? null,
    action,
    entity_type: "calendar",
    entity_id: null,
    metadata,
  });

  if (error) {
    console.error("Failed to write PTE calendar audit log", error);
  }
}

export function isDateInsidePteBookingWindow(value: Date, now = new Date()) {
  const window = getPteCalendarWindow(now);
  return value.getTime() >= window.start.getTime() && value.getTime() < window.end.getTime();
}

export async function createPteGoogleMeetEvent({
  attendeeEmail,
  bookingAt,
  description,
  durationMinutes,
  summary,
}: {
  attendeeEmail: string;
  bookingAt: string;
  description: string;
  durationMinutes: number;
  summary: string;
}) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_BOOKING_ID || "primary";
  const start = new Date(bookingAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const response = await fetch(
    `${googleCalendarApiBase}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: {
          dateTime: start.toISOString(),
          timeZone: getPteCalendarTimeZone(),
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: getPteCalendarTimeZone(),
        },
        attendees: [{ email: attendeeEmail }],
        conferenceData: {
          createRequest: {
            requestId: crypto.randomBytes(16).toString("hex"),
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      }),
    },
  );
  const body = (await response.json()) as GoogleEventResponse;

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Could not create Google Calendar event.");
  }

  const meetLink = body.hangoutLink
    || body.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri
    || "";

  if (!body.id || !meetLink) {
    throw new Error("Google Calendar event was created without a Meet link. Try reconnecting Google Calendar.");
  }

  return {
    eventId: body.id,
    eventLink: body.htmlLink ?? "",
    meetLink,
  };
}

async function getStoredCalendarConnection() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pte_google_calendar_connection")
    .select("connected_email,refresh_token,granted_scopes,calendar_ids,last_sync_at,last_error")
    .eq("id", defaultConnectionId)
    .maybeSingle<StoredCalendarConnection>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getGoogleAccessToken() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const connection = await getStoredCalendarConnection();

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google Calendar OAuth environment variables.");
  }

  if (!connection?.refresh_token) {
    throw new Error("Google Calendar is not connected.");
  }

  const response = await fetchGoogleToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: connection.refresh_token,
  });

  if (!response.access_token) {
    throw new Error("Google did not return an access token.");
  }

  return response.access_token;
}

async function fetchGoogleToken(params: Record<string, string>) {
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const body = (await response.json()) as GoogleTokenResponse;

  if (!response.ok) {
    throw new Error(body.error_description ?? body.error ?? "Google OAuth request failed.");
  }

  return body;
}

function getGoogleRedirectUri() {
  return process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${getSiteUrl()}/api/admin/pte/google-calendar/callback`;
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function getBlockingCalendarEntries() {
  const connection = await getStoredCalendarConnection();
  const storedIds = connection?.calendar_ids ?? {};
  const entries = [
    { role: "work", id: process.env.GOOGLE_CALENDAR_WORK_ID || storedIds.work },
    { role: "university", id: process.env.GOOGLE_CALENDAR_UNIVERSITY_ID || storedIds.university },
    { role: "blocker", id: process.env.GOOGLE_CALENDAR_BLOCKER_ID || storedIds.blocker },
  ];

  return entries.filter((entry): entry is { role: string; id: string } => Boolean(entry.id));
}

function getCalendarRoleById(calendarEntries: Array<{ role: string; id: string }>) {
  return new Map(calendarEntries.map((entry) => [entry.id, entry.role]));
}

function getPteCalendarWindow(now = new Date()) {
  return {
    start: now,
    end: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
  };
}

function getPteThisWeekWindow(now = new Date()) {
  return {
    start: now,
    end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
}

async function getFreshBlockedSlotCache() {
  const data = await getBlockedSlotCache();

  if (!data || !data.fetchedAt) {
    return null;
  }

  const fetchedAt = new Date(data.fetchedAt).getTime();

  if (Number.isNaN(fetchedAt) || Date.now() - fetchedAt > cacheFreshMs) {
    return null;
  }

  return data;
}

async function getBlockedSlotCache() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pte_google_calendar_block_cache")
    .select("window_start,window_end,time_zone,busy_ranges,blocked_slots,calendar_errors,fetched_at")
    .eq("id", defaultConnectionId)
    .maybeSingle<{
      window_start: string;
      window_end: string;
      time_zone: string;
      busy_ranges: PteBusyRange[];
      blocked_slots: PteBlockedSlot[];
      calendar_errors: Record<string, unknown>;
      fetched_at: string;
    }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const fetchedAt = data.fetched_at;
  const stale = Date.now() - new Date(fetchedAt).getTime() > 26 * 60 * 60 * 1000;

  return {
    windowStart: data.window_start,
    windowEnd: data.window_end,
    timeZone: data.time_zone,
    busyRanges: data.busy_ranges,
    blockedSlots: data.blocked_slots,
    calendarErrors: data.calendar_errors,
    fetchedAt,
    stale,
  };
}

function flattenBusyResponse(
  body: GoogleFreeBusyResponse,
  calendarRoles: Map<string, string>,
) {
  const busyRanges: PteBusyRange[] = [];
  const calendarErrors: Record<string, unknown> = {};

  Object.entries(body.calendars ?? {}).forEach(([calendarId, calendar]) => {
    if (calendar.errors?.length) {
      calendarErrors[calendarId] = calendar.errors;
    }

    calendar.busy?.forEach((busy) => {
      busyRanges.push({
        calendarId,
        calendarRole: calendarRoles.get(calendarId) ?? calendarId,
        start: busy.start,
        end: busy.end,
      });
    });
  });

  return { busyRanges, calendarErrors };
}

function busyRangesToBlockedSlots(
  busyRanges: PteBusyRange[],
  windowStart: Date,
  windowEnd: Date,
  timeZone: string,
) {
  const blocked = new Map<string, PteBlockedSlot>();
  const slotMs = 30 * 60 * 1000;
  const firstSlot = Math.floor(windowStart.getTime() / slotMs) * slotMs;

  for (let slotStartMs = firstSlot; slotStartMs < windowEnd.getTime(); slotStartMs += slotMs) {
    const slotStart = new Date(slotStartMs);
    const slotEnd = new Date(slotStartMs + slotMs);

    if (slotEnd.getTime() <= windowStart.getTime()) {
      continue;
    }

    const overlappingRanges = busyRanges.filter((range) => {
      const busyStart = new Date(range.start).getTime();
      const busyEnd = new Date(range.end).getTime();
      return busyStart < slotEnd.getTime() && busyEnd > slotStart.getTime();
    });

    if (overlappingRanges.length === 0) {
      continue;
    }

    const local = getLocalSlotParts(slotStart, timeZone);
    const value = `${local.date}-${local.time}`;
    blocked.set(value, {
      ...local,
      value,
      calendarIds: Array.from(new Set(overlappingRanges.map((range) => range.calendarId))),
    });
  }

  return Array.from(blocked.values()).sort((a, b) => a.value.localeCompare(b.value));
}

function getLocalSlotParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const day = valueByType.get("weekday")?.toLowerCase() ?? "";
  const year = valueByType.get("year") ?? "";
  const month = valueByType.get("month") ?? "";
  const dayOfMonth = valueByType.get("day") ?? "";
  const hour = valueByType.get("hour") ?? "";
  const minute = valueByType.get("minute") ?? "";

  return {
    date: `${year}-${month}-${dayOfMonth}`,
    day,
    time: `${hour}:${minute}`,
  };
}

function getWeekDayLabels(start: Date, timeZone: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    const parts = getLocalSlotParts(date, timeZone);
    const label = new Intl.DateTimeFormat("en-AU", {
      timeZone,
      day: "numeric",
      month: "short",
    }).format(date);

    return {
      date: parts.date,
      day: parts.day,
      label,
    };
  });
}

function getLocalDateOnly(date: Date, timeZone: string) {
  const parts = getLocalSlotParts(date, timeZone);
  return new Date(`${parts.date}T00:00:00`);
}

async function recordCalendarSyncError(message: string) {
  const supabase = createAdminClient();
  await supabase.from("pte_google_calendar_connection").upsert({
    id: defaultConnectionId,
    last_error: message,
  });
}
