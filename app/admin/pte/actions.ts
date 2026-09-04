"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/admin";
import { createPteGoogleMeetEvent } from "@/lib/google/calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getClassLabel,
  getClassUnitPrice,
  hasInvoiceBankDetails,
  renderInvoiceHtml,
  renderInvoiceText,
  type PteInvoice,
} from "./invoice";
import {
  renderFinancialYearStatementPdfBuffer,
  renderInvoicePdfBuffer,
} from "./pdfSnapshots";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const ptePdfBucket = "pte-pdfs";
const studentAuthConfirmPath = "/pte/auth/confirm";

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/pte/dashboard");
  }

  return user;
}

async function logPteAdminAction({
  actorEmail,
  action,
  entityType,
  entityId,
  metadata = {},
}: {
  actorEmail?: string | null;
  action: string;
  entityType: "lead" | "invoice" | "statement" | "booking" | "booking_request" | "testimonial";
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("pte_admin_audit_logs").insert({
    actor_email: actorEmail?.toLowerCase() ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });

  if (error) {
    console.error("Failed to write PTE audit log", error);
  }
}

function isChecked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function updatePteLead(formData: FormData) {
  const user = await requireAdminUser();

  const id = formData.get("id")?.toString();

  if (!id) {
    throw new Error("Missing lead id.");
  }

  const firstSessionBooked = isChecked(formData.get("firstSessionBooked"));
  const firstSessionAt = formData.get("firstSessionAt")?.toString().trim() ?? "";
  const nextFollowUpAt = formData.get("nextFollowUpAt")?.toString().trim() ?? "";
  const availability = formData
    .getAll("availability")
    .map((value) => value.toString().trim())
    .filter(Boolean);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pte_leads")
    .update({
      followed_up: isChecked(formData.get("followedUp")),
      next_follow_up_at: nextFollowUpAt ? nextFollowUpAt : null,
      first_session_booked: firstSessionBooked,
      first_session_at: firstSessionBooked && firstSessionAt ? firstSessionAt : null,
      payment_received: isChecked(formData.get("paymentReceived")),
      availability,
      notes: formData.get("notes")?.toString().trim() ?? "",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "lead.updated",
    entityType: "lead",
    entityId: id,
    metadata: {
      followedUp: isChecked(formData.get("followedUp")),
      firstSessionBooked,
      nextFollowUpAt: nextFollowUpAt || null,
      availabilityCount: availability.length,
    },
  });

  revalidatePath("/admin/pte");
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTemporaryPassword() {
  return `${randomBytes(32).toString("base64url")}Aa1!`;
}

function createStudentAuthConfirmLink(tokenHash: string, type: "signup" | "recovery") {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
  });

  return `${getSiteUrl()}${studentAuthConfirmPath}?${params.toString()}`;
}

async function sendPteStudentAccountSetupEmail({
  firstName,
  setupLink,
  to,
}: {
  firstName: string;
  setupLink: string;
  to: string;
}) {
  const safeFirstName = escapeHtml(firstName);
  const safeSetupLink = escapeHtml(setupLink);

  await transporter.sendMail({
    from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Set up your PTE student dashboard",
    text: [
      `Hi ${firstName},`,
      "",
      "I have created your PTE student dashboard. Use this secure link to set your password and sign in:",
      setupLink,
      "",
      "Nirav Pandey",
    ].join("\n"),
    html: `
      <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
        <p>Hi ${safeFirstName},</p>
        <p>I have created your PTE student dashboard. Use this secure link to set your password and sign in:</p>
        <p><a href="${safeSetupLink}">Set up student dashboard</a></p>
        <p>Nirav Pandey</p>
      </div>
    `,
  });
}

async function generateStudentPasswordSetupLink({
  email,
  firstName,
  lastName,
}: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  const supabase = createAdminClient();
  const normalizedEmail = email.toLowerCase();
  const { error: createUserError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: createTemporaryPassword(),
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: "pte-student",
    },
  });

  if (createUserError && !createUserError.message.toLowerCase().includes("already")) {
    throw createUserError;
  }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: normalizedEmail,
  });

  if (error) {
    throw error;
  }

  const tokenHash = data.properties?.hashed_token;

  if (!tokenHash) {
    throw new Error("Could not create password setup link.");
  }

  return createStudentAuthConfirmLink(tokenHash, "recovery");
}

export async function sendPteStudentAccountInvite(formData: FormData) {
  const user = await requireAdminUser();
  const leadId = formData.get("leadId")?.toString();

  if (!leadId) {
    throw new Error("Missing lead id.");
  }

  const supabase = createAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from("pte_leads")
    .select("id,first_name,last_name,email")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message ?? "Could not find student.");
  }

  const setupLink = await generateStudentPasswordSetupLink({
    email: lead.email,
    firstName: lead.first_name,
    lastName: lead.last_name,
  });

  await sendPteStudentAccountSetupEmail({
    firstName: lead.first_name,
    setupLink,
    to: lead.email,
  });

  await logPteAdminAction({
    actorEmail: user.email,
    action: "student_account.invite_sent",
    entityType: "lead",
    entityId: leadId,
    metadata: {
      emailedTo: lead.email.toLowerCase(),
    },
  });

  revalidatePath("/admin/pte");
}

function normalizeMeetingUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Meeting URL must start with http:// or https://.");
    }

    return url.toString();
  } catch (error) {
    if (error instanceof Error && error.message === "Meeting URL must start with http:// or https://.") {
      throw error;
    }

    throw new Error("Meeting URL must be a valid link.");
  }
}

function getMelbourneOffsetMinutes(date: Date) {
  const timeZoneName = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
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
    throw new Error("Booking time must be a valid date and time.");
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
    throw new Error("Booking time must be a valid date and time.");
  }

  return normalizedDate.toISOString();
}

async function syncLeadNextBooking(supabase: SupabaseClient, leadId: string) {
  const { data: nextBooking, error: nextBookingError } = await supabase
    .from("pte_bookings")
    .select("booking_at")
    .eq("lead_id", leadId)
    .eq("status", "confirmed")
    .gte("booking_at", new Date().toISOString())
    .order("booking_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextBookingError) {
    throw new Error(nextBookingError.message);
  }

  const { error: updateLeadError } = await supabase
    .from("pte_leads")
    .update({
      first_session_booked: Boolean(nextBooking),
      first_session_at: nextBooking?.booking_at ?? null,
    })
    .eq("id", leadId);

  if (updateLeadError) {
    throw new Error(updateLeadError.message);
  }
}

async function sendPteBookingConfirmationEmail({
  bookingAt,
  bookingCostType,
  confirmationToken,
  firstName,
  meetingUrl,
  to,
}: {
  bookingAt: string;
  bookingCostType: "free" | "paid";
  confirmationToken: string;
  firstName: string;
  meetingUrl: string;
  to: string;
}) {
  const confirmationLink = `${getSiteUrl()}/pte?booking=${confirmationToken}`;
  const bookingLabel = `${new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Australia/Melbourne",
  }).format(new Date(bookingAt))} (Melbourne time)`;
  const bookingDateLabel = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeZone: "Australia/Melbourne",
  }).format(new Date(bookingAt));
  const bookingCostLabel = bookingCostType === "free" ? "Free session" : "Paid session";
  const sessionLink = meetingUrl || confirmationLink;
  const safeFirstName = escapeHtml(firstName);
  const safeBookingLabel = escapeHtml(bookingLabel);
  const safeBookingCostLabel = escapeHtml(bookingCostLabel);
  const safeSessionLink = escapeHtml(sessionLink);

  await transporter.sendMail({
    from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
    to,
    subject: `PTE tutoring session confirmed — ${bookingDateLabel}`,
    text: [
      `Hi ${firstName},`,
      "",
      `Your PTE tutoring session is confirmed for ${bookingLabel}.`,
      "",
      `Booking: ${bookingCostLabel}`,
      "",
      "Please check below for the meeting link and use it to join your session at the scheduled time.",
      "",
      `Meeting link: ${sessionLink}`,
      "",
      "See you then,",
      "Nirav Pandey",
    ].join("\n"),
    html: `
      <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
        <p>Hi ${safeFirstName},</p>
        <p>Your PTE tutoring session is confirmed for <strong>${safeBookingLabel}</strong>.</p>
        <p><strong>Booking:</strong> ${safeBookingCostLabel}</p>
        <p>Please check below for the meeting link and use it to join your session at the scheduled time.</p>
        <p>
          <a href="${safeSessionLink}" style="display: inline-block; border-radius: 6px; background: #111827; color: #fff; padding: 10px 16px; text-decoration: none; font-weight: 700;">Join session</a>
        </p>
        <p><strong>Meeting link:</strong><br /><a href="${safeSessionLink}">${safeSessionLink}</a></p>
        <p>See you then,<br /><strong>Nirav Pandey</strong></p>
      </div>
    `,
  });
}

async function createMeetForBooking({
  bookingAt,
  durationMinutes = 90,
  firstName,
  lastName,
  to,
}: {
  bookingAt: string;
  durationMinutes?: number;
  firstName: string;
  lastName: string;
  to: string;
}) {
  return createPteGoogleMeetEvent({
    attendeeEmail: to,
    bookingAt,
    description: `PTE tutoring session with ${firstName} ${lastName}`,
    durationMinutes,
    summary: `PTE tutoring: ${firstName} ${lastName}`,
  });
}

async function sendPteBookingCancellationEmail({
  bookingAt,
  firstName,
  to,
}: {
  bookingAt: string;
  firstName: string;
  to: string;
}) {
  const bookingLabel = `${new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Australia/Melbourne",
  }).format(new Date(bookingAt))} (Melbourne time)`;
  const bookingDateLabel = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeZone: "Australia/Melbourne",
  }).format(new Date(bookingAt));
  const safeFirstName = escapeHtml(firstName);
  const safeBookingLabel = escapeHtml(bookingLabel);

  await transporter.sendMail({
    from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
    to,
    subject: `PTE tutoring session cancelled — ${bookingDateLabel}`,
    text: [
      `Hi ${firstName},`,
      "",
      `Your PTE tutoring session scheduled for ${bookingLabel} has been cancelled.`,
      "",
      "I will get back to you if we need to reschedule.",
      "",
      "Nirav Pandey",
    ].join("\n"),
    html: `
      <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
        <p>Hi ${safeFirstName},</p>
        <p>Your PTE tutoring session scheduled for <strong>${safeBookingLabel}</strong> has been cancelled.</p>
        <p>I will get back to you if we need to reschedule.</p>
        <p>Nirav Pandey</p>
      </div>
    `,
  });
}

export async function createPteBooking(formData: FormData) {
  const user = await requireAdminUser();
  const leadId = formData.get("leadId")?.toString();
  const bookingAt = formData.get("bookingAt")?.toString().trim() ?? "";
  const normalizedBookingAt = bookingAt ? normalizeMelbourneDatetimeLocal(bookingAt) : "";
  const bookingCostType = formData.get("bookingCostType") === "free" ? "free" : "paid";
  const meetingUrlInput = formData.get("meetingUrl")?.toString().trim() ?? "";
  let meetingUrl = normalizeMeetingUrl(meetingUrlInput);

  if (!leadId || !bookingAt) {
    throw new Error("Missing booking details.");
  }

  const supabase = createAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from("pte_leads")
    .select("id,first_name,last_name,email")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message ?? "Could not find student.");
  }

  const googleEvent = meetingUrl
    ? { eventId: "", eventLink: "", meetLink: meetingUrl }
    : await createMeetForBooking({
        bookingAt: normalizedBookingAt,
        firstName: lead.first_name,
        lastName: lead.last_name,
        to: lead.email,
      });
  meetingUrl = googleEvent.meetLink;

  const { data: booking, error: bookingError } = await supabase
    .from("pte_bookings")
    .insert({
      lead_id: leadId,
      booking_at: normalizedBookingAt,
      duration_minutes: 90,
      notes: meetingUrl,
      meeting_url: meetingUrl,
      google_calendar_event_id: googleEvent.eventId || null,
      google_calendar_event_link: googleEvent.eventLink || null,
    })
    .select("id,confirmation_token,booking_at")
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? "Could not create booking.");
  }

  await sendPteBookingConfirmationEmail({
    bookingAt: booking.booking_at,
    bookingCostType,
    confirmationToken: booking.confirmation_token,
    firstName: lead.first_name,
    meetingUrl,
    to: lead.email,
  });

  const sentAt = new Date().toISOString();
  const { error: updateBookingError } = await supabase
    .from("pte_bookings")
    .update({ confirmation_sent_at: sentAt })
    .eq("id", booking.id);

  if (updateBookingError) {
    throw new Error(updateBookingError.message);
  }

  await syncLeadNextBooking(supabase, leadId);

  await logPteAdminAction({
    actorEmail: user.email,
    action: "booking.created",
    entityType: "booking",
    entityId: booking.id,
    metadata: {
      leadId,
      bookingAt: booking.booking_at,
      bookingCostType,
      meetingUrl: meetingUrl || null,
      googleCalendarEventId: googleEvent.eventId || null,
      googleCalendarEventLink: googleEvent.eventLink || null,
      confirmationSentAt: sentAt,
    },
  });

  revalidatePath("/admin/pte");
}

export async function approvePteBookingRequest(formData: FormData) {
  const user = await requireAdminUser();
  const requestId = formData.get("requestId")?.toString();
  const bookingCostType = formData.get("bookingCostType") === "free" ? "free" : "paid";

  if (!requestId) {
    throw new Error("Missing booking request id.");
  }

  const supabase = createAdminClient();
  const { data: request, error: requestError } = await supabase
    .from("pte_booking_requests")
    .select("id,lead_id,requested_start_at,duration_minutes,status,student_note,pte_leads(first_name,last_name,email)")
    .eq("id", requestId)
    .single<{
      id: string;
      lead_id: string;
      requested_start_at: string;
      duration_minutes: number;
      status: string;
      student_note: string;
      pte_leads: { first_name: string; last_name: string; email: string } | null;
    }>();

  if (requestError || !request) {
    throw new Error(requestError?.message ?? "Could not find booking request.");
  }

  if (request.status !== "pending") {
    throw new Error("This booking request has already been resolved.");
  }

  const lead = request.pte_leads;

  if (!lead) {
    throw new Error("Booking request is missing student details.");
  }

  const googleEvent = await createMeetForBooking({
    bookingAt: request.requested_start_at,
    durationMinutes: request.duration_minutes,
    firstName: lead.first_name,
    lastName: lead.last_name,
    to: lead.email,
  });

  const { data: booking, error: bookingError } = await supabase
    .from("pte_bookings")
    .insert({
      lead_id: request.lead_id,
      booking_at: request.requested_start_at,
      duration_minutes: request.duration_minutes,
      notes: googleEvent.meetLink,
      meeting_url: googleEvent.meetLink,
      google_calendar_event_id: googleEvent.eventId,
      google_calendar_event_link: googleEvent.eventLink || null,
    })
    .select("id,confirmation_token,booking_at")
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? "Could not approve booking request.");
  }

  await sendPteBookingConfirmationEmail({
    bookingAt: booking.booking_at,
    bookingCostType,
    confirmationToken: booking.confirmation_token,
    firstName: lead.first_name,
    meetingUrl: googleEvent.meetLink,
    to: lead.email,
  });

  const sentAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("pte_bookings")
    .update({ confirmation_sent_at: sentAt })
    .eq("id", booking.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: requestUpdateError } = await supabase
    .from("pte_booking_requests")
    .update({
      status: "approved",
      approved_booking_id: booking.id,
      resolved_at: sentAt,
    })
    .eq("id", request.id);

  if (requestUpdateError) {
    throw new Error(requestUpdateError.message);
  }

  await syncLeadNextBooking(supabase, request.lead_id);

  await logPteAdminAction({
    actorEmail: user.email,
    action: "booking_request.approved",
    entityType: "booking_request",
    entityId: request.id,
    metadata: {
      bookingId: booking.id,
      bookingAt: booking.booking_at,
      googleCalendarEventId: googleEvent.eventId,
      googleCalendarEventLink: googleEvent.eventLink || null,
      meetLink: googleEvent.meetLink,
    },
  });

  revalidatePath("/admin/pte");
}

export async function updatePteBooking(formData: FormData) {
  const user = await requireAdminUser();
  const leadId = formData.get("leadId")?.toString();
  const bookingId = formData.get("bookingId")?.toString();
  const bookingAt = formData.get("bookingAt")?.toString().trim() ?? "";
  const normalizedBookingAt = bookingAt ? normalizeMelbourneDatetimeLocal(bookingAt) : "";
  const bookingCostType = formData.get("bookingCostType") === "free" ? "free" : "paid";
  const meetingUrlInput = formData.get("meetingUrl")?.toString().trim() ?? "";
  const meetingUrl = normalizeMeetingUrl(meetingUrlInput);

  if (!leadId || !bookingId || !bookingAt) {
    throw new Error("Missing booking details.");
  }

  const supabase = createAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from("pte_leads")
    .select("id,first_name,last_name,email")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message ?? "Could not find student.");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("pte_bookings")
    .update({
      booking_at: normalizedBookingAt,
      notes: meetingUrl,
      meeting_url: meetingUrl || null,
      status: "confirmed",
    })
    .eq("id", bookingId)
    .eq("lead_id", leadId)
    .select("id,confirmation_token,booking_at")
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? "Could not update booking.");
  }

  await sendPteBookingConfirmationEmail({
    bookingAt: booking.booking_at,
    bookingCostType,
    confirmationToken: booking.confirmation_token,
    firstName: lead.first_name,
    meetingUrl,
    to: lead.email,
  });

  const sentAt = new Date().toISOString();
  const { error: updateBookingError } = await supabase
    .from("pte_bookings")
    .update({ confirmation_sent_at: sentAt })
    .eq("id", booking.id);

  if (updateBookingError) {
    throw new Error(updateBookingError.message);
  }

  await syncLeadNextBooking(supabase, leadId);

  await logPteAdminAction({
    actorEmail: user.email,
    action: "booking.updated",
    entityType: "booking",
    entityId: booking.id,
    metadata: {
      leadId,
      bookingAt: booking.booking_at,
      bookingCostType,
      meetingUrl: meetingUrl || null,
      confirmationSentAt: sentAt,
    },
  });

  revalidatePath("/admin/pte");
}

export async function cancelPteBooking(formData: FormData) {
  const user = await requireAdminUser();
  const leadId = formData.get("leadId")?.toString();
  const bookingId = formData.get("bookingId")?.toString();

  if (!leadId || !bookingId) {
    throw new Error("Missing booking details.");
  }

  const supabase = createAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from("pte_leads")
    .select("id,first_name,last_name,email")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message ?? "Could not find student.");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("pte_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("lead_id", leadId)
    .select("id,booking_at")
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? "Could not cancel booking.");
  }

  let cancellationSentAt: string | null = null;
  if (new Date(booking.booking_at).getTime() > Date.now()) {
    await sendPteBookingCancellationEmail({
      bookingAt: booking.booking_at,
      firstName: lead.first_name,
      to: lead.email,
    });

    cancellationSentAt = new Date().toISOString();
    const { error: cancellationSentError } = await supabase
      .from("pte_bookings")
      .update({ cancellation_sent_at: cancellationSentAt })
      .eq("id", booking.id);

    if (cancellationSentError) {
      throw new Error(cancellationSentError.message);
    }
  }

  await syncLeadNextBooking(supabase, leadId);

  await logPteAdminAction({
    actorEmail: user.email,
    action: "booking.cancelled",
    entityType: "booking",
    entityId: booking.id,
    metadata: {
      leadId,
      bookingAt: booking.booking_at,
      cancellationSentAt,
    },
  });

  revalidatePath("/admin/pte");
}

export async function removePteBookingFromAdmin(formData: FormData) {
  const user = await requireAdminUser();
  const leadId = formData.get("leadId")?.toString();
  const bookingId = formData.get("bookingId")?.toString();

  if (!leadId || !bookingId) {
    throw new Error("Missing booking details.");
  }

  const supabase = createAdminClient();
  const { data: booking, error: bookingError } = await supabase
    .from("pte_bookings")
    .update({ status: "removed" })
    .eq("id", bookingId)
    .eq("lead_id", leadId)
    .lt("booking_at", new Date().toISOString())
    .select("id,booking_at")
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? "Could not remove booking from admin.");
  }

  await syncLeadNextBooking(supabase, leadId);

  await logPteAdminAction({
    actorEmail: user.email,
    action: "booking.removed_from_admin",
    entityType: "booking",
    entityId: booking.id,
    metadata: {
      leadId,
      bookingAt: booking.booking_at,
    },
  });

  revalidatePath("/admin/pte");
}

export async function ratePteBookingInteraction(formData: FormData) {
  const user = await requireAdminUser();
  const leadId = formData.get("leadId")?.toString();
  const bookingId = formData.get("bookingId")?.toString();
  const rating = Number(formData.get("interactionRating"));
  const notes = formData.get("interactionNotes")?.toString().trim() ?? "";

  if (!leadId || !bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Invalid interaction rating.");
  }

  const supabase = createAdminClient();
  const ratedAt = new Date().toISOString();
  const { data: booking, error: bookingError } = await supabase
    .from("pte_bookings")
    .update({
      interaction_rating: rating,
      interaction_notes: notes,
      interaction_rated_at: ratedAt,
    })
    .eq("id", bookingId)
    .eq("lead_id", leadId)
    .select("id,booking_at")
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message ?? "Could not rate interaction.");
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "booking.interaction_rated",
    entityType: "booking",
    entityId: booking.id,
    metadata: {
      leadId,
      bookingAt: booking.booking_at,
      rating,
    },
  });

  revalidatePath("/admin/pte");
}

export async function upsertPteTestimonial(formData: FormData) {
  const user = await requireAdminUser();
  const leadId = formData.get("leadId")?.toString();
  const studentName = formData.get("testimonialStudentName")?.toString().trim() ?? "";
  const testimonialText = formData.get("testimonialText")?.toString().trim() ?? "";
  const rating = Number(formData.get("testimonialRating"));
  const image = formData.get("testimonialImage");

  if (!leadId || !studentName || !testimonialText || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Invalid testimonial details.");
  }

  const supabase = createAdminClient();
  let imageStoragePath: string | undefined;

  if (image instanceof File && image.size > 0) {
    const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `testimonials/${leadId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("student-image-bucket")
      .upload(storagePath, image, {
        contentType: image.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    imageStoragePath = storagePath;
  }

  const payload = {
    lead_id: leadId,
    student_name: studentName,
    testimonial_text: testimonialText,
    rating,
    ...(imageStoragePath ? { image_storage_path: imageStoragePath } : {}),
  };
  const { data, error } = await supabase
    .from("pte_testimonials")
    .upsert(payload, { onConflict: "lead_id" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save testimonial.");
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "testimonial.saved",
    entityType: "testimonial",
    entityId: data.id,
    metadata: {
      leadId,
      rating,
      hasImage: Boolean(imageStoragePath),
    },
  });

  revalidatePath("/admin/pte");
  revalidatePath("/pte");
}

export async function createPteInvoice(formData: FormData) {
  const user = await requireAdminUser();

  const leadId = formData.get("leadId")?.toString();
  const classType = formData.get("invoiceClassType")?.toString() ?? "";
  const classCount = Number(formData.get("classCount"));
  const serviceDate = formData.get("serviceDate")?.toString() || null;
  const dueDate = formData.get("dueDate")?.toString() || null;
  const notes = formData.get("invoiceNotes")?.toString().trim() ?? "";
  const unitPrice = getClassUnitPrice(classType);

  if (!leadId || !unitPrice || !Number.isInteger(classCount) || classCount < 1) {
    throw new Error("Invalid invoice details.");
  }

  const supabase = createAdminClient();
  const invoiceNumber = `PTE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

  const { error } = await supabase.from("pte_invoices").insert({
    lead_id: leadId,
    invoice_number: invoiceNumber,
    class_type: classType,
    class_label: getClassLabel(classType),
    class_count: classCount,
    unit_price: unitPrice,
    service_date: serviceDate,
    due_date: dueDate,
    notes,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "invoice.generated",
    entityType: "lead",
    entityId: leadId,
    metadata: {
      invoiceNumber,
      classType,
      classCount,
      unitPrice,
    },
  });

  revalidatePath("/admin/pte");
}

async function getInvoice(invoiceId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pte_invoices")
    .select("*, pte_leads(first_name, last_name, email)")
    .eq("id", invoiceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PteInvoice;
}

async function ensureInvoicePdfSnapshot(invoice: PteInvoice) {
  const supabase = createAdminClient();

  if (invoice.pdf_storage_path) {
    const { data, error } = await supabase.storage.from(ptePdfBucket).download(invoice.pdf_storage_path);

    if (error || !data) {
      throw new Error(error?.message ?? "Could not download stored invoice PDF.");
    }

    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      path: invoice.pdf_storage_path,
      generatedAt: invoice.pdf_generated_at,
    };
  }

  const buffer = await renderInvoicePdfBuffer(invoice);
  const generatedAt = new Date().toISOString();
  const path = `invoices/${invoice.invoice_number}.pdf`;
  const { error: uploadError } = await supabase.storage.from(ptePdfBucket).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: updateError } = await supabase
    .from("pte_invoices")
    .update({
      pdf_storage_path: path,
      pdf_generated_at: generatedAt,
    })
    .eq("id", invoice.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { buffer, path, generatedAt };
}

function getFinancialYear(startYear: number) {
  return {
    label: `FY${String(startYear).slice(2)}-${String(startYear + 1).slice(2)}`,
    start: new Date(startYear, 6, 1),
    end: new Date(startYear + 1, 5, 30, 23, 59, 59, 999),
  };
}

export async function sendPteInvoice(formData: FormData) {
  const user = await requireAdminUser();

  const invoiceId = formData.get("invoiceId")?.toString();

  if (!invoiceId) {
    throw new Error("Missing invoice id.");
  }

  if (!hasInvoiceBankDetails()) {
    throw new Error("Missing invoice bank details in environment variables.");
  }

  const invoice = await getInvoice(invoiceId);
  const recipient = invoice.pte_leads?.email;

  if (!recipient) {
    throw new Error("Invoice recipient is missing an email address.");
  }

  const pdfSnapshot = await ensureInvoicePdfSnapshot(invoice);

  await transporter.sendMail({
    from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
    to: recipient,
    subject: `PTE tutoring invoice ${invoice.invoice_number}`,
    text: renderInvoiceText(invoice),
    html: renderInvoiceHtml(invoice),
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: pdfSnapshot.buffer,
        contentType: "application/pdf",
      },
    ],
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pte_invoices")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      emailed_to: recipient.toLowerCase(),
      pdf_storage_path: pdfSnapshot.path,
      pdf_generated_at: pdfSnapshot.generatedAt,
    })
    .eq("id", invoice.id);

  if (error) {
    throw new Error(error.message);
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "invoice.sent",
    entityType: "invoice",
    entityId: invoice.id,
    metadata: {
      invoiceNumber: invoice.invoice_number,
      emailedTo: recipient.toLowerCase(),
      pdfStoragePath: pdfSnapshot.path,
    },
  });

  revalidatePath("/admin/pte");
}

export async function markPteInvoicePaid(formData: FormData) {
  const user = await requireAdminUser();

  const invoiceId = formData.get("invoiceId")?.toString();

  if (!invoiceId) {
    throw new Error("Missing invoice id.");
  }

  const invoice = await getInvoice(invoiceId);

  if (invoice.status !== "sent") {
    throw new Error("Only sent invoices can be marked paid.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pte_invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (error) {
    throw new Error(error.message);
  }

  const { error: leadError } = await supabase
    .from("pte_leads")
    .update({ payment_received: true })
    .eq("id", invoice.lead_id);

  if (leadError) {
    throw new Error(leadError.message);
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "invoice.marked_paid",
    entityType: "invoice",
    entityId: invoiceId,
    metadata: {
      invoiceNumber: invoice.invoice_number,
      leadId: invoice.lead_id,
      totalAmount: invoice.total_amount,
    },
  });

  revalidatePath("/admin/pte");
}

export async function markPteInvoiceUnpaid(formData: FormData) {
  const user = await requireAdminUser();
  const invoiceId = formData.get("invoiceId")?.toString();

  if (!invoiceId) {
    throw new Error("Missing invoice id.");
  }

  const invoice = await getInvoice(invoiceId);

  if (invoice.status !== "paid") {
    throw new Error("Only paid invoices can be marked unpaid.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pte_invoices")
    .update({
      status: "sent",
      paid_at: null,
    })
    .eq("id", invoiceId);

  if (error) {
    throw new Error(error.message);
  }

  const { count, error: paidCountError } = await supabase
    .from("pte_invoices")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", invoice.lead_id)
    .eq("status", "paid");

  if (paidCountError) {
    throw new Error(paidCountError.message);
  }

  const { error: leadError } = await supabase
    .from("pte_leads")
    .update({ payment_received: Boolean(count) })
    .eq("id", invoice.lead_id);

  if (leadError) {
    throw new Error(leadError.message);
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "invoice.marked_unpaid",
    entityType: "invoice",
    entityId: invoiceId,
    metadata: {
      invoiceNumber: invoice.invoice_number,
      leadId: invoice.lead_id,
    },
  });

  revalidatePath("/admin/pte");
}

export async function generatePteFinancialYearStatement(formData: FormData) {
  const user = await requireAdminUser();
  const year = Number(formData.get("year"));

  if (!Number.isInteger(year) || year < 2020 || year > new Date().getFullYear() + 1) {
    throw new Error("Invalid financial year.");
  }

  const supabase = createAdminClient();
  const financialYear = getFinancialYear(year);
  const { data, error } = await supabase
    .from("pte_invoices")
    .select("*, pte_leads(first_name,last_name,email)")
    .eq("status", "paid")
    .gte("paid_at", financialYear.start.toISOString())
    .lte("paid_at", financialYear.end.toISOString())
    .order("paid_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const invoices = (data ?? []) as PteInvoice[];
  const generatedAt = new Date();
  const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  const buffer = await renderFinancialYearStatementPdfBuffer({
    financialYearLabel: financialYear.label,
    periodLabel: `${financialYear.start.toLocaleDateString("en-AU")} to ${financialYear.end.toLocaleDateString("en-AU")}`,
    invoices,
    generatedAt,
  });
  const storagePath = `statements/${year}-${year + 1}/${generatedAt.toISOString().replaceAll(":", "-")}.pdf`;
  const { error: uploadError } = await supabase.storage.from(ptePdfBucket).upload(storagePath, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: insertError } = await supabase.from("pte_financial_year_statements").insert({
    actor_email: user.email?.toLowerCase() ?? null,
    financial_year_start: year,
    invoice_count: invoices.length,
    total_amount: total,
    pdf_storage_path: storagePath,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(ptePdfBucket)
    .createSignedUrl(storagePath, 10 * 60, {
      download: `${financialYear.label}-pte-income-summary.pdf`,
    });

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error(signedUrlError?.message ?? "Could not create statement download link.");
  }

  await logPteAdminAction({
    actorEmail: user.email,
    action: "statement.generated",
    entityType: "statement",
    metadata: {
      financialYearStart: year,
      invoiceCount: invoices.length,
      totalAmount: total,
      pdfStoragePath: storagePath,
    },
  });

  redirect(signedUrlData.signedUrl);
}
