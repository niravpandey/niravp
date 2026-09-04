import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { getCachedPteBlockedSlots, getPteCalendarTimeZone } from "@/lib/google/calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { signOutPteStudent } from "../auth/actions";
import { availabilityTimeSlots } from "../components/pteContent";
import StudentAvailabilityEditor from "./StudentAvailabilityEditor";
import StudentBookingRequestForm, { type StudentBookingOption } from "./StudentBookingRequestForm";
import StudentBookingStatusList from "./StudentBookingStatusList";

export const metadata: Metadata = {
  title: "PTE Student Dashboard | Nirav Pandey",
};

function getLocalSlotParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: getPteCalendarTimeZone(),
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return {
    date: `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`,
    day: valueByType.get("weekday")?.toLowerCase() ?? "",
    time: `${valueByType.get("hour")}:${valueByType.get("minute")}`,
  };
}

function getTwoWeekAvailabilityDays(now = new Date()) {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now.getTime() + index * 24 * 60 * 60 * 1000);
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: getPteCalendarTimeZone(),
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).formatToParts(date);
    const valueByType = new Map(parts.map((part) => [part.type, part.value]));
    const local = getLocalSlotParts(date);
    const weekday = valueByType.get("weekday") ?? "";
    const day = valueByType.get("day") ?? "";
    const month = valueByType.get("month") ?? "";

    return {
      date: local.date,
      label: `${weekday} ${day} ${month} ${valueByType.get("year")}`,
      shortLabel: `${weekday} ${day} ${month}`,
    };
  });
}

function projectWeeklyAvailabilityToDated({
  days,
  weeklyAvailability,
}: {
  days: Array<{ date: string }>;
  weeklyAvailability: string[];
}) {
  const weeklyAvailabilitySet = new Set(weeklyAvailability);

  return days.flatMap((day) =>
    availabilityTimeSlots.flatMap((slot) => {
      const local = getLocalSlotParts(new Date(`${day.date}T${slot.value}:00`));
      const weeklyValue = `${local.day}-${slot.value}`;

      return weeklyAvailabilitySet.has(weeklyValue) ? [`${day.date}-${slot.value}`] : [];
    }),
  );
}

function getMinimumNoticeBlockedAvailability(days: Array<{ date: string }>, now = new Date()) {
  const earliestAllowed = now.getTime() + 24 * 60 * 60 * 1000;

  return days.flatMap((day) =>
    availabilityTimeSlots.flatMap((slot) => {
      const slotDate = new Date(`${day.date}T${slot.value}:00`);

      return slotDate.getTime() < earliestAllowed ? [`${day.date}-${slot.value}`] : [];
    }),
  );
}

function getBookingOptions({
  availability,
  busyRanges,
  blockedValues,
}: {
  availability: string[];
  busyRanges: Array<{ start: string; end: string }>;
  blockedValues: Set<string>;
}): StudentBookingOption[] {
  const now = new Date();
  const slotMs = 30 * 60 * 1000;
  const classDurationMinutes = 60;
  const classDurationMs = classDurationMinutes * 60 * 1000;
  const minimumNoticeMs = 24 * 60 * 60 * 1000;
  const earliestAllowed = new Date(now.getTime() + minimumNoticeMs);
  const firstSlot = new Date(Math.ceil(earliestAllowed.getTime() / slotMs) * slotMs);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const savedAvailability = new Set(availability);
  const busyWindows = busyRanges
    .map((range) => ({
      start: new Date(range.start).getTime(),
      end: new Date(range.end).getTime(),
    }))
    .filter((range) => !Number.isNaN(range.start) && !Number.isNaN(range.end));
  const candidates: BookingCandidate[] = [];

  for (let cursor = firstSlot; cursor < twoWeeksFromNow; cursor = new Date(cursor.getTime() + slotMs)) {
    const local = getLocalSlotParts(cursor);

    if (!availabilityTimeSlots.some((slot) => slot.value === local.time)) {
      continue;
    }

    const windowSlots = Array.from({ length: classDurationMinutes / 30 }, (_, index) => {
      const slotDate = new Date(cursor.getTime() + index * slotMs);
      const slotLocal = getLocalSlotParts(slotDate);

      return {
        datedValue: `${slotLocal.date}-${slotLocal.time}`,
      };
    });

    if (
      windowSlots.some((slot) => !savedAvailability.has(slot.datedValue) || blockedValues.has(slot.datedValue))
      || busyWindows.some((range) => range.start < cursor.getTime() + classDurationMs && range.end > cursor.getTime())
    ) {
      continue;
    }

    const availabilityPadding = getAvailabilityPaddingMinutes(cursor, savedAvailability, classDurationMinutes);

    candidates.push({
      durationMinutes: classDurationMinutes,
      ninetyMinuteFitScore: getNinetyMinuteFitScore(availabilityPadding),
      value: cursor.toISOString(),
      label: new Intl.DateTimeFormat("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: getPteCalendarTimeZone(),
      }).format(cursor),
      score: getSimpleBookingScore(cursor, now, availabilityPadding),
    });
  }

  const rankedCandidates = candidates.sort(compareBookingCandidates);
  const visibleCandidates = getDiverseBookingCandidates(rankedCandidates, 4);
  const compatibilityStep = visibleCandidates.length > 1
    ? 35 / (visibleCandidates.length - 1)
    : 0;

  return visibleCandidates.map(({ durationMinutes, label, value }, index) => ({
    compatibility: Math.round(100 - index * compatibilityStep),
    durationMinutes,
    label,
    rank: index + 1,
    value,
    windowLabel: new Date(value).getTime() < now.getTime() + 7 * 24 * 60 * 60 * 1000 ? "This week" : "Next week",
  }));
}

type BookingCandidate = Omit<StudentBookingOption, "compatibility" | "rank" | "windowLabel"> & {
  ninetyMinuteFitScore: number;
  score: number;
};

function getDiverseBookingCandidates(candidates: BookingCandidate[], limit: number) {
  const selected: BookingCandidate[] = [];
  const selectedDates = new Set<string>();

  for (const candidate of candidates) {
    const date = getLocalSlotParts(new Date(candidate.value)).date;

    if (selectedDates.has(date)) {
      continue;
    }

    selected.push(candidate);
    selectedDates.add(date);

    if (selected.length === limit) {
      return selected;
    }
  }

  for (const candidate of candidates) {
    if (selected.some((selectedCandidate) => selectedCandidate.value === candidate.value)) {
      continue;
    }

    selected.push(candidate);

    if (selected.length === limit) {
      return selected;
    }
  }

  return selected;
}

function compareBookingCandidates(a: BookingCandidate, b: BookingCandidate) {
  return b.ninetyMinuteFitScore - a.ninetyMinuteFitScore
    || a.value.localeCompare(b.value)
    || b.score - a.score;
}

function getSimpleBookingScore(
  start: Date,
  now: Date,
  availabilityPadding: { before: number; after: number },
) {
  const daysFromNow = Math.max(0, (start.getTime() - now.getTime()) / 86_400_000);

  return Math.round(100 - daysFromNow * 4 + getNinetyMinuteFitScore(availabilityPadding) * 10);
}

function getNinetyMinuteFitScore(availabilityPadding: { before: number; after: number }) {
  if (availabilityPadding.before >= 30 && availabilityPadding.after >= 30) {
    return 3;
  }

  if (availabilityPadding.after >= 30) {
    return 2;
  }

  if (availabilityPadding.before >= 30) {
    return 1;
  }

  return 0;
}

function getAvailabilityPaddingMinutes(
  start: Date,
  savedAvailability: Set<string>,
  durationMinutes: 60 | 90,
) {
  const slotMs = 30 * 60 * 1000;
  const classDurationMs = durationMinutes * 60 * 1000;
  let before = 0;
  let after = 0;

  for (let offset = -slotMs; offset >= -6 * slotMs; offset -= slotMs) {
    const local = getLocalSlotParts(new Date(start.getTime() + offset));

    if (!savedAvailability.has(`${local.date}-${local.time}`)) {
      break;
    }

    before += 30;
  }

  for (let offset = classDurationMs; offset <= classDurationMs + 5 * slotMs; offset += slotMs) {
    const local = getLocalSlotParts(new Date(start.getTime() + offset));

    if (!savedAvailability.has(`${local.date}-${local.time}`)) {
      break;
    }

    after += 30;
  }

  return { before, after };
}

export default async function PteStudentDashboardPage() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user?.email) {
    redirect("/pte/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/pte/login?verify=email");
  }

  const supabase = createAdminClient();
  const twoWeekCalendarBlocks = await getCachedPteBlockedSlots().catch(() => ({
    blockedSlots: [],
    busyRanges: [],
  }));
  const availabilityDays = getTwoWeekAvailabilityDays();
  const minimumNoticeBlockedAvailability = getMinimumNoticeBlockedAvailability(availabilityDays);
  const blockedAvailability = [
    ...twoWeekCalendarBlocks.blockedSlots.map((slot) => slot.value),
    ...minimumNoticeBlockedAvailability,
  ];
  const blockedDatedValues = new Set(blockedAvailability);
  const { data: lead, error } = await supabase
    .from("pte_leads")
    .select("id,first_name,email,availability,availability_next_two_weeks,updated_at")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      first_name: string;
      email: string;
      availability: string[];
      availability_next_two_weeks: string[];
      updated_at: string;
    }>();

  if (error) {
    throw new Error(error.message);
  }

  const [{ data: bookingRequests, error: bookingRequestsError }, { data: confirmedBookings, error: confirmedBookingsError }] = lead
    ? await Promise.all([
        supabase
          .from("pte_booking_requests")
          .select("id,requested_start_at,duration_minutes,status,student_note,created_at")
          .eq("lead_id", lead.id)
          .order("requested_start_at", { ascending: true })
          .limit(12)
          .returns<Array<{
            id: string;
            requested_start_at: string;
            duration_minutes: number;
            status: "pending" | "approved" | "declined";
            student_note: string;
            created_at: string;
          }>>(),
        supabase
          .from("pte_bookings")
          .select("id,booking_at,duration_minutes,status,meeting_url,google_calendar_event_link")
          .eq("lead_id", lead.id)
          .eq("status", "confirmed")
          .gte("booking_at", new Date().toISOString())
          .order("booking_at", { ascending: true })
          .limit(8)
          .returns<Array<{
            id: string;
            booking_at: string;
            duration_minutes: number;
            status: "confirmed" | "cancelled" | "removed";
            meeting_url: string | null;
            google_calendar_event_link: string | null;
          }>>(),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];

  if (bookingRequestsError) {
    throw new Error(bookingRequestsError.message);
  }

  if (confirmedBookingsError) {
    throw new Error(confirmedBookingsError.message);
  }

  const blockedAvailabilitySet = new Set(blockedAvailability);
  const currentDatedAvailability = (lead
    ? (lead.availability_next_two_weeks?.length
        ? lead.availability_next_two_weeks
        : projectWeeklyAvailabilityToDated({
            days: availabilityDays,
            weeklyAvailability: lead.availability ?? [],
          }))
    : []).filter((value) => !blockedAvailabilitySet.has(value));
  const bookingOptions = getBookingOptions({
    availability: currentDatedAvailability,
    busyRanges: twoWeekCalendarBlocks.busyRanges,
    blockedValues: blockedDatedValues,
  });
  const bookingOptionsKey = bookingOptions.map((option) => `${option.value}:${option.durationMinutes}`).join("|");

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 font-sans sm:px-8 sm:py-24">
      <Link href="/pte" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
        <PhosphorIcon name="arrow-left" size={16} />
        <span>PTE</span>
      </Link>

      <section className="mt-8 border border-gray-200 bg-white p-5 shadow-sm shadow-gray-100/60 sm:p-6">
        {lead ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-mauve-500">Student dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-blue-900">Hello {lead.first_name || "there"}</h1>
            <p className="mt-2 text-sm text-gray-600">
              You are signed in as {lead.email}. Keep your availability for the next two weeks up to date.
            </p>
            <StudentAvailabilityEditor
              blockedAvailability={blockedAvailability}
              days={availabilityDays}
              initialAvailability={currentDatedAvailability}
            />
            <StudentBookingStatusList
              confirmedBookings={confirmedBookings ?? []}
              requests={bookingRequests ?? []}
            />
            <StudentBookingRequestForm
              key={bookingOptionsKey}
              options={bookingOptions}
            />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-blue-900">No PTE student record found</h1>
            <p className="mt-2 text-sm text-gray-600">
              This account is signed in, but it does not match a PTE enquiry yet.
            </p>
          </>
        )}

        <form action={signOutPteStudent} className="mt-6">
          <button
            type="submit"
            className="border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
