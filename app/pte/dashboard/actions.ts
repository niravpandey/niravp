"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCachedPteBlockedSlots, getPteCalendarTimeZone, isDateInsidePteBookingWindow } from "@/lib/google/calendar";
import { availabilityTimeSlots } from "../components/pteContent";

export type StudentAvailabilityState = {
  success: boolean;
  message: string;
};

const minimumAvailabilitySlots = 6;
const OWNER_EMAIL = "nrvpandey2005@gmail.com";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function getTwoWeekAvailabilityContext(now = new Date()) {
  const values = new Set<string>();
  const weeklyValueByDatedValue = new Map<string, string>();

  for (let dayIndex = 0; dayIndex < 14; dayIndex += 1) {
    const date = new Date(now.getTime() + dayIndex * 24 * 60 * 60 * 1000);
    const localDay = getMelbourneParts(date);

    for (const slot of availabilityTimeSlots) {
      const datedValue = `${localDay.date}-${slot.value}`;

      values.add(datedValue);
      weeklyValueByDatedValue.set(datedValue, `${localDay.day}-${slot.value}`);
    }
  }

  return { values, weeklyValueByDatedValue };
}

function getFormAvailability(formData: FormData, validAvailabilityValues: Set<string>) {
  return Array.from(
    new Set(
      formData
        .getAll("availability")
        .map((value) => value.toString().trim())
        .filter((value) => validAvailabilityValues.has(value)),
    ),
  );
}

function getIsolatedAvailabilityValues(availability: string[]) {
  const values = new Set(availability);

  return availability.filter((value) => {
    const date = value.slice(0, 10);
    const time = value.slice(11);
    const [hour, minute] = time.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;
    const previous = `${date}-${String(Math.floor((totalMinutes - 30) / 60)).padStart(2, "0")}:${String((totalMinutes - 30) % 60).padStart(2, "0")}`;
    const next = `${date}-${String(Math.floor((totalMinutes + 30) / 60)).padStart(2, "0")}:${String((totalMinutes + 30) % 60).padStart(2, "0")}`;

    return !values.has(previous) && !values.has(next);
  });
}

function getWeeklyAvailabilityFromDatedAvailability(
  datedAvailability: string[],
  weeklyValueByDatedValue: Map<string, string>,
) {
  return Array.from(
    new Set(
      datedAvailability.flatMap((value) => {
        const weeklyValue = weeklyValueByDatedValue.get(value);

        return weeklyValue ? [weeklyValue] : [];
      }),
    ),
  );
}

function projectWeeklyAvailabilityToDated(
  weeklyAvailability: string[],
  validAvailabilityValues: Set<string>,
  weeklyValueByDatedValue: Map<string, string>,
) {
  const weeklyAvailabilitySet = new Set(weeklyAvailability);

  return Array.from(validAvailabilityValues).filter((datedValue) => {
    const weeklyValue = weeklyValueByDatedValue.get(datedValue);

    return weeklyValue ? weeklyAvailabilitySet.has(weeklyValue) : false;
  });
}

export async function updateStudentAvailability(
  _prevState: StudentAvailabilityState | null,
  formData: FormData,
): Promise<StudentAvailabilityState> {
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

  const availabilityContext = getTwoWeekAvailabilityContext();
  const availability = getFormAvailability(formData, availabilityContext.values);

  if (availability.length < minimumAvailabilitySlots) {
    return {
      success: false,
      message: "Please select at least 3 hours of availability before saving.",
    };
  }

  const calendarBlocks = await getCachedPteBlockedSlots();
  const blockedValues = new Set(calendarBlocks.blockedSlots.map((slot) => slot.value));
  const availableValues = availability.filter((value) => !blockedValues.has(value));

  if (availableValues.length < minimumAvailabilitySlots) {
    return {
      success: false,
      message: "Some selected times are now unavailable. Please choose at least 3 hours from the remaining green slots.",
    };
  }

  const isolatedValues = getIsolatedAvailabilityValues(availableValues);

  if (isolatedValues.length > 0) {
    return {
      success: false,
      message: "Please select availability in blocks of at least 1 hour. A single 30 minute block by itself is not enough.",
    };
  }

  const supabase = createAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from("pte_leads")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (leadError) {
    return { success: false, message: "Could not find your student record. Please try again." };
  }

  if (!lead) {
    return { success: false, message: "No PTE enquiry was found for this account." };
  }

  const { error } = await supabase
    .from("pte_leads")
    .update({
      availability: getWeeklyAvailabilityFromDatedAvailability(
        availableValues,
        availabilityContext.weeklyValueByDatedValue,
      ),
      availability_next_two_weeks: availableValues,
    })
    .eq("id", lead.id);

  if (error) {
    return { success: false, message: "Could not save your availability. Please try again." };
  }

  revalidatePath("/pte/dashboard");

  return {
    success: true,
    message: "Availability updated for the next two weeks.",
  };
}

function getMelbourneParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: getPteCalendarTimeZone(),
    weekday: "long",
    year: "numeric",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const hour = valueByType.get("hour") === "24" ? "00" : valueByType.get("hour");

  return {
    date: `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`,
    day: valueByType.get("weekday")?.toLowerCase() ?? "",
    time: `${hour}:${valueByType.get("minute")}`,
  };
}

function formatBookingDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: getPteCalendarTimeZone(),
  }).format(value);
}

function getMelbourneOffsetMinutes(date: Date) {
  const timeZoneName = new Intl.DateTimeFormat("en-AU", {
    timeZone: getPteCalendarTimeZone(),
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const offsetMatch = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(timeZoneName ?? "");

  if (!offsetMatch) {
    throw new Error("Could not resolve Melbourne timezone offset.");
  }

  const [, sign, hourText, minuteText = "00"] = offsetMatch;
  const offsetMinutes = Number(hourText) * 60 + Number(minuteText);
  return sign === "-" ? -offsetMinutes : offsetMinutes;
}

function normalizeMelbourneDatetimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const wallTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let offsetMinutes = getMelbourneOffsetMinutes(new Date(wallTimeAsUtc));
  let utcTime = wallTimeAsUtc - offsetMinutes * 60_000;
  const verifiedOffsetMinutes = getMelbourneOffsetMinutes(new Date(utcTime));

  if (verifiedOffsetMinutes !== offsetMinutes) {
    offsetMinutes = verifiedOffsetMinutes;
    utcTime = wallTimeAsUtc - offsetMinutes * 60_000;
  }

  const normalizedDate = new Date(utcTime);

  if (Number.isNaN(normalizedDate.getTime())) {
    return null;
  }

  return normalizedDate;
}

function isValidAvailabilityGridTime(date: Date) {
  const local = getMelbourneParts(date);

  return availabilityTimeSlots.some((slot) => slot.value === local.time);
}

export async function createStudentBookingRequest(
  _prevState: StudentAvailabilityState | null,
  formData: FormData,
): Promise<StudentAvailabilityState> {
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

  const requestMode = formData.get("requestMode") === "custom" ? "custom" : "recommended";
  const requestedStartAt = formData.get("requestedStartAt")?.toString() ?? "";
  const customStartAt = formData.get("customStartAt")?.toString().trim() ?? "";
  const recommendedDuration = Number(formData.get("durationMinutes"));
  const customDuration = Number(formData.get("customDurationMinutes"));
  const durationMinutes = requestMode === "custom"
    ? (customDuration === 90 ? 90 : 60)
    : (recommendedDuration === 90 ? 90 : 60);
  const studentNote = formData.get("studentNote")?.toString().trim().slice(0, 1000) ?? "";
  const requestedDate = requestMode === "custom"
    ? normalizeMelbourneDatetimeLocal(customStartAt)
    : new Date(requestedStartAt);

  if (!requestedDate || Number.isNaN(requestedDate.getTime())) {
    return { success: false, message: "Choose a class time before sending the request." };
  }

  if (!isValidAvailabilityGridTime(requestedDate)) {
    return { success: false, message: "Please choose a start time on the hour or half hour between 8:00 AM and 8:30 PM." };
  }

  if (requestedDate.getTime() < Date.now() + 24 * 60 * 60 * 1000) {
    return { success: false, message: "Please choose a time at least 24 hours from now." };
  }

  if (!isDateInsidePteBookingWindow(requestedDate)) {
    return { success: false, message: "Please choose a time within the next two weeks." };
  }

  const supabase = createAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from("pte_leads")
    .select("id,first_name,last_name,email,availability,availability_next_two_weeks")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      availability: string[];
      availability_next_two_weeks: string[];
    }>();

  if (leadError || !lead) {
    return { success: false, message: "Could not find your student record. Please try again." };
  }

  const slotMs = 30 * 60 * 1000;
  const durationMs = durationMinutes * 60 * 1000;
  const requestedWindowSlots = Array.from({ length: durationMinutes / 30 }, (_, index) => {
    const offset = index * slotMs;
    const slotLocal = getMelbourneParts(new Date(requestedDate.getTime() + offset));

    return {
      blockedValue: `${slotLocal.date}-${slotLocal.time}`,
    };
  });

  if (requestMode === "recommended") {
    const availabilityContext = getTwoWeekAvailabilityContext();
    const datedAvailability = lead.availability_next_two_weeks?.length
      ? lead.availability_next_two_weeks
      : projectWeeklyAvailabilityToDated(
          lead.availability ?? [],
          availabilityContext.values,
          availabilityContext.weeklyValueByDatedValue,
        );
    const datedAvailabilitySet = new Set(datedAvailability);

    if (requestedWindowSlots.some((slot) => !datedAvailabilitySet.has(slot.blockedValue))) {
      return { success: false, message: "Please choose one of your saved available times." };
    }
  }

  const calendarBlocks = await getCachedPteBlockedSlots();
  const blockedValues = new Set(calendarBlocks.blockedSlots.map((slot) => slot.value));
  const overlapsBusyRange = calendarBlocks.busyRanges.some((range) => {
    const busyStart = new Date(range.start).getTime();
    const busyEnd = new Date(range.end).getTime();

    return busyStart < requestedDate.getTime() + durationMs && busyEnd > requestedDate.getTime();
  });

  if (requestedWindowSlots.some((slot) => blockedValues.has(slot.blockedValue)) || overlapsBusyRange) {
    return { success: false, message: "That time is no longer available on Nirav's calendar. Please choose another time." };
  }

  const { data: request, error } = await supabase
    .from("pte_booking_requests")
    .insert({
      lead_id: lead.id,
      requested_start_at: requestedDate.toISOString(),
      duration_minutes: durationMinutes,
      student_note: studentNote,
      notified_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !request) {
    return { success: false, message: "Could not send your booking request. Please try again." };
  }

  const requestedLabel = formatBookingDateTime(requestedDate);
  await transporter.sendMail({
    from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
    to: OWNER_EMAIL,
    replyTo: lead.email,
    subject: `PTE booking request: ${lead.first_name} ${lead.last_name}`,
    text: [
      "New PTE booking request",
      "",
      `Student: ${lead.first_name} ${lead.last_name}`,
      `Email: ${lead.email}`,
      `Requested time: ${requestedLabel} (Melbourne time)`,
      `Duration: ${durationMinutes === 60 ? "1 hour" : "1 hour 30 min"}`,
      `Request type: ${requestMode === "custom" ? "Custom time" : "Recommended time"}`,
      `Note: ${studentNote || "Not provided"}`,
      "",
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/pte`,
    ].join("\n"),
  });

  revalidatePath("/pte/dashboard");

  return {
    success: true,
    message: "Booking request sent. This is not confirmed yet; Nirav will approve it and email the final Meet link.",
  };
}
