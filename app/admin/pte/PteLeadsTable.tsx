"use client";

import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { AvailabilityMatrix } from "@/app/pte/components/AvailabilityMatrix";
import { availabilityDays, availabilityTimeSlots } from "@/app/pte/components/pteContent";
import {
  approvePteBookingRequest,
  cancelPteBooking,
  createPteBooking,
  createPteInvoice,
  markPteInvoiceUnpaid,
  markPteInvoicePaid,
  ratePteBookingInteraction,
  removePteBookingFromAdmin,
  sendPteStudentAccountInvite,
  sendPteInvoice,
  updatePteLead,
  updatePteBooking,
  upsertPteTestimonial,
} from "./actions";
import type { PteInvoice } from "./invoice";

export type PteLeadTableRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  class_type: string;
  class_label: string;
  focus_areas: string[];
  score_goal: string;
  availability: string[];
  followed_up: boolean;
  next_follow_up_at: string | null;
  first_session_booked: boolean;
  first_session_at: string | null;
  payment_received: boolean;
  notes: string;
  pte_invoices?: Array<{ id: string }>;
  pte_bookings?: Array<{
    id: string;
    booking_at: string;
    status: "confirmed" | "cancelled" | "removed";
    notes: string | null;
    meeting_url?: string | null;
    google_calendar_event_link?: string | null;
    interaction_rating: number | null;
    interaction_notes: string | null;
    interaction_rated_at: string | null;
  }>;
  pte_booking_requests?: Array<{
    id: string;
    requested_start_at: string;
    duration_minutes: number;
    status: "pending" | "approved" | "declined";
    student_note: string;
  }>;
};

type InvoiceClassOption = {
  value: string;
  label: string;
  priceLabel: string;
};

type LeadsResponse = {
  leads: PteLeadTableRow[];
  page: number;
  pageSize: number;
  total: number;
};

type SortKey = "name" | "created_at" | "class_label" | "score_goal" | "status" | "next_follow_up_at";

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, PteLeadTableRow>();
const columns = helper.columns([
  helper.accessor((row) => `${row.first_name} ${row.last_name}`, { id: "name", header: "Student" }),
  helper.accessor("class_label", { header: "Class" }),
  helper.accessor("score_goal", { header: "Target" }),
  helper.accessor((row) => getLeadStatusLabel(row), { id: "status", header: "Status" }),
  helper.accessor("created_at", { header: "Submitted" }),
  helper.accessor("next_follow_up_at", { header: "Next follow-up" }),
  helper.accessor("first_session_at", { id: "next_booking", header: "Next booking" }),
  helper.accessor((row) => row.pte_invoices?.length ?? 0, { id: "invoice_count", header: "Invoices" }),
]);

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNextBooking(value: string | null) {
  if (!value) {
    return "Not applicable";
  }

  const date = new Date(value);
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(date.getTime()) || date < now || date > twoWeeksFromNow) {
    return "Not applicable";
  }

  return formatDateTime(value);
}

function getDisplayBooking(lead: PteLeadTableRow) {
  const now = Date.now();
  const confirmedBookings = (lead.pte_bookings ?? []).filter((booking) => booking.status === "confirmed");
  const futureBooking = confirmedBookings
    .filter((booking) => new Date(booking.booking_at).getTime() >= now)
    .sort((a, b) => new Date(a.booking_at).getTime() - new Date(b.booking_at).getTime())[0];

  if (futureBooking) {
    return { booking: futureBooking, timing: "future" as const };
  }

  const pastBooking = confirmedBookings
    .filter((booking) => new Date(booking.booking_at).getTime() < now)
    .sort((a, b) => new Date(b.booking_at).getTime() - new Date(a.booking_at).getTime())[0];

  return pastBooking ? { booking: pastBooking, timing: "past" as const } : null;
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatScoreGoal(value: string) {
  return value === "not-sure-yet" ? "Not sure yet" : `${value}/90`;
}

function formatValueList(values: string[]) {
  return values.length
    ? values
        .map(formatAvailabilityValue)
        .join(", ")
    : "Not provided";
}

function formatAvailabilityValue(value: string) {
  const timeSlotMatch = /^([a-z]+)-(\d{2}):(\d{2})$/.exec(value);

  if (timeSlotMatch) {
    const [, day, hourText, minuteText] = timeSlotMatch;
    const hour24 = Number(hourText);
    const hour12 = hour24 % 12 || 12;
    const suffix = hour24 < 12 ? "AM" : "PM";
    const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);

    return `${dayLabel} ${hour12}:${minuteText} ${suffix}`;
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

function formatInvoiceDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getInitials(lead: PteLeadTableRow) {
  return `${lead.first_name.charAt(0)}${lead.last_name.charAt(0)}`.toUpperCase();
}

function getLeadStatusLabel(lead: PteLeadTableRow) {
  if (lead.payment_received) {
    return "Paid";
  }

  if (lead.first_session_booked) {
    return "Booking set";
  }

  if (lead.followed_up) {
    return "Followed up";
  }

  return "Needs follow-up";
}

function getLeadStatusClass(lead: PteLeadTableRow) {
  if (lead.payment_received) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (lead.first_session_booked) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (lead.followed_up) {
    return "border-mauve-200 bg-mauve-50 text-mauve-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function StatusBadge({ lead }: { lead: PteLeadTableRow }) {
  return (
    <span className={`inline-flex w-fit items-center border px-2 py-1 text-xs font-semibold ${getLeadStatusClass(lead)}`}>
      {getLeadStatusLabel(lead)}
    </span>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-800">{value}</p>
    </div>
  );
}

function AvailabilityOverviewButton({
  availability,
  leadId,
}: {
  availability: string[];
  leadId: string;
}) {
  const selectedValues = new Set(availability);

  function openAvailabilityEditor() {
    const editor = document.getElementById(`availability-editor-${leadId}`) as HTMLDetailsElement | null;
    if (!editor) {
      return;
    }

    editor.open = true;
    editor.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <button
      type="button"
      onClick={openAvailabilityEditor}
      aria-label="Edit student availability"
      className="grid w-full max-w-28 grid-cols-7 grid-rows-[repeat(26,0.2rem)] gap-px bg-gray-200 p-px focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
    >
      {availabilityTimeSlots.flatMap((slot) =>
        availabilityDays.map((day) => {
          const value = `${day.toLowerCase()}-${slot.value}`;
          const isSelected = selectedValues.has(value);

          return (
            <span
              key={value}
              className={`min-w-0 ${isSelected ? "bg-blue-900" : "bg-white"}`}
              aria-hidden="true"
            />
          );
        }),
      )}
    </button>
  );
}

function AdminAvailabilityEditor({
  initialAvailability,
  leadId,
}: {
  initialAvailability: string[];
  leadId: string;
}) {
  const [selectedAvailability, setSelectedAvailability] = useState(initialAvailability);

  return (
    <details id={`availability-editor-${leadId}`} className="border border-gray-200 bg-gray-50">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Edit availability
      </summary>
      <div className="grid gap-2 px-3 pb-3">
        <p className="text-sm text-gray-600">Select every 30 minute block that usually works.</p>
        <div className="overflow-x-auto pb-1">
          <AvailabilityMatrix
            selectedAvailability={selectedAvailability}
            onAvailabilityChange={setSelectedAvailability}
          />
        </div>
      </div>
    </details>
  );
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center border border-blue-900 bg-blue-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
    >
      {children}
    </button>
  );
}

function SecondarySubmitButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function getSortableValue(row: PteLeadTableRow, key: SortKey) {
  if (key === "name") {
    return `${row.first_name} ${row.last_name}`.toLowerCase();
  }

  if (key === "status") {
    return getLeadStatusLabel(row).toLowerCase();
  }

  if (key === "score_goal") {
    return row.score_goal === "not-sure-yet" ? -1 : Number(row.score_goal);
  }

  return row[key] ?? "";
}

function isSortKey(value: string): value is SortKey {
  return ["name", "created_at", "class_label", "score_goal", "status", "next_follow_up_at"].includes(value);
}

function isServerSortKey(value: SortKey) {
  return value !== "status";
}

async function fetchLeads({
  page,
  studentQuery,
  invoiceQuery,
  statusFilter,
  sort,
}: {
  page: number;
  studentQuery: string;
  invoiceQuery: string;
  statusFilter: string;
  sort: { key: SortKey; direction: "asc" | "desc" };
}) {
  const params = new URLSearchParams({ page: String(page) });

  if (studentQuery) {
    params.set("student", studentQuery);
  }

  if (invoiceQuery) {
    params.set("invoice", invoiceQuery);
  }

  if (statusFilter) {
    params.set("status", statusFilter);
  }

  if (isServerSortKey(sort.key)) {
    params.set("sort", sort.key);
    params.set("direction", sort.direction);
  }

  const response = await fetch(`/api/admin/pte/leads?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Could not load PTE leads.");
  }

  return (await response.json()) as LeadsResponse;
}

async function fetchLeadInvoices(leadId: string) {
  const response = await fetch(`/api/admin/pte/leads/${leadId}/invoices`);

  if (!response.ok) {
    throw new Error("Could not load invoices.");
  }

  return (await response.json()) as { invoices: PteInvoice[] };
}

type LeadTestimonial = {
  id: string;
  student_name: string;
  testimonial_text: string;
  rating: number;
  image_storage_path: string | null;
};

async function fetchLeadTestimonial(leadId: string) {
  const response = await fetch(`/api/admin/pte/leads/${leadId}/testimonial`);

  if (!response.ok) {
    throw new Error("Could not load testimonial.");
  }

  return (await response.json()) as { testimonial: LeadTestimonial | null };
}

function BookingSection({
  controlClass,
  labelClass,
  lead,
}: {
  controlClass: string;
  labelClass: string;
  lead: PteLeadTableRow;
}) {
  const displayBooking = getDisplayBooking(lead);
  const currentBooking = displayBooking?.booking ?? null;
  const isPastBooking = displayBooking?.timing === "past";
  const currentMeetingUrl = currentBooking?.meeting_url || currentBooking?.notes || "";
  const currentEventLink = currentBooking?.google_calendar_event_link ?? "";

  return (
    <section className="grid gap-3 border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Booking</h3>
        <span className="text-sm font-semibold text-gray-600">
          {currentBooking ? formatDateTime(currentBooking.booking_at) : formatNextBooking(lead.first_session_at)}
        </span>
      </div>

      {currentBooking && isPastBooking ? (
        <div className="grid gap-3 border border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-800">Past booking</p>
            <form action={removePteBookingFromAdmin}>
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="bookingId" value={currentBooking.id} />
              <button
                type="submit"
                className="border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
              >
                Remove booking
              </button>
            </form>
          </div>
          <details className="border border-gray-200 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-gray-700">
              Rate interaction
              {currentBooking.interaction_rating ? ` · ${currentBooking.interaction_rating}/5` : ""}
            </summary>
            <form action={ratePteBookingInteraction} className="grid gap-3 p-3 lg:grid-cols-[9rem_1fr_auto] lg:items-end">
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="bookingId" value={currentBooking.id} />
              <label className={labelClass}>
                Rating
                <select
                  name="interactionRating"
                  defaultValue={currentBooking.interaction_rating ?? 5}
                  className={controlClass}
                >
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </select>
              </label>
              <label className={labelClass}>
                Notes
                <input
                  name="interactionNotes"
                  type="text"
                  defaultValue={currentBooking.interaction_notes ?? ""}
                  className={controlClass}
                  placeholder="How did the session go?"
                />
              </label>
              <PrimaryButton>Save rating</PrimaryButton>
            </form>
          </details>
        </div>
      ) : currentBooking ? (
        <div className="grid gap-3 border border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-800">Current confirmed booking</p>
            <form action={cancelPteBooking}>
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="bookingId" value={currentBooking.id} />
              <button
                type="submit"
                className="border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50"
              >
                Cancel booking
              </button>
            </form>
          </div>
          <form action={updatePteBooking} className="grid gap-3 lg:grid-cols-[15rem_10rem_1fr_auto] lg:items-end">
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="bookingId" value={currentBooking.id} />
            <label className={labelClass}>
              Booking time
              <input
                name="bookingAt"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocal(currentBooking.booking_at)}
                className={controlClass}
              />
            </label>
            <label className={labelClass}>
              Booking type
              <select name="bookingCostType" defaultValue="paid" className={controlClass}>
                <option value="paid">Paid</option>
                <option value="free">Free</option>
              </select>
            </label>
            <label className={labelClass}>
              Meeting URL
              <input
                name="meetingUrl"
                type="url"
                className={controlClass}
                defaultValue={currentMeetingUrl}
                placeholder="https://meet.google.com/..."
              />
            </label>
            <PrimaryButton>Adjust and email</PrimaryButton>
          </form>
          {currentMeetingUrl || currentEventLink ? (
            <div className="flex flex-wrap gap-2">
              {currentMeetingUrl ? (
                <a href={currentMeetingUrl} target="_blank" rel="noreferrer" className="w-fit border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600">
                  Attend Meet
                </a>
              ) : null}
              {currentEventLink ? (
                <a href={currentEventLink} target="_blank" rel="noreferrer" className="w-fit border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900">
                  Calendar event
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No confirmed future booking.</p>
      )}

      <BookingRequestsSection lead={lead} />

      <form action={createPteBooking} className="grid gap-3 lg:grid-cols-[15rem_10rem_1fr_auto] lg:items-end">
        <input type="hidden" name="leadId" value={lead.id} />
        <label className={labelClass}>
          New booking time
          <input name="bookingAt" type="datetime-local" required className={controlClass} />
        </label>
        <label className={labelClass}>
          Booking type
          <select name="bookingCostType" defaultValue="paid" className={controlClass}>
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
        </label>
        <label className={labelClass}>
          Meeting URL
          <input name="meetingUrl" type="url" className={controlClass} placeholder="https://meet.google.com/..." />
        </label>
        <PrimaryButton>Create and email</PrimaryButton>
      </form>
    </section>
  );
}

function BookingRequestsSection({ lead }: { lead: PteLeadTableRow }) {
  const pendingRequests = (lead.pte_booking_requests ?? [])
    .filter((request) => request.status === "pending")
    .sort((a, b) => new Date(a.requested_start_at).getTime() - new Date(b.requested_start_at).getTime());

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-950">Pending student booking requests</p>
      {pendingRequests.map((request) => (
        <form key={request.id} action={approvePteBookingRequest} className="grid gap-2 border border-amber-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <input type="hidden" name="requestId" value={request.id} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{formatDateTime(request.requested_start_at)}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{formatClassDuration(request.duration_minutes)}</p>
            {request.student_note ? (
              <p className="mt-1 text-xs text-gray-600">{request.student_note}</p>
            ) : null}
          </div>
          <select name="bookingCostType" defaultValue="paid" className="border border-gray-300 bg-white px-2 py-1.5 text-sm font-semibold text-gray-800">
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
          <SecondarySubmitButton>Approve and email Meet</SecondarySubmitButton>
        </form>
      ))}
    </div>
  );
}

function formatClassDuration(durationMinutes: number) {
  return durationMinutes === 60 ? "1 hour" : "1 hour 30 min";
}

function TestimonialSection({
  controlClass,
  labelClass,
  lead,
}: {
  controlClass: string;
  labelClass: string;
  lead: PteLeadTableRow;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isFetching, error } = useQuery({
    queryKey: ["pte-lead-testimonial", lead.id],
    queryFn: () => fetchLeadTestimonial(lead.id),
    enabled: isOpen,
  });
  const testimonial = data?.testimonial ?? null;

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="border border-gray-200 bg-white"
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Testimonial{testimonial ? " saved" : ""}
      </summary>
      <form key={testimonial?.id ?? "new"} action={upsertPteTestimonial} className="grid gap-3 border-t border-gray-200 p-4">
        <input type="hidden" name="leadId" value={lead.id} />
        {isFetching && <p className="text-sm text-gray-500">Loading testimonial...</p>}
        {error && <p className="text-sm text-red-700">{(error as Error).message}</p>}
        <div className="grid gap-3 lg:grid-cols-[1fr_7rem]">
          <label className={labelClass}>
            Student display name
            <input
              name="testimonialStudentName"
              type="text"
              required
              defaultValue={testimonial?.student_name ?? `${lead.first_name} ${lead.last_name}`}
              className={controlClass}
            />
          </label>
          <label className={labelClass}>
            Rating
            <input name="testimonialRating" type="number" min={1} max={5} defaultValue={testimonial?.rating ?? 5} required className={controlClass} />
          </label>
        </div>
        <label className={labelClass}>
          Testimonial text
          <textarea
            name="testimonialText"
            required
            rows={4}
            defaultValue={testimonial?.testimonial_text ?? ""}
            className={`${controlClass} min-h-28 resize-y`}
            placeholder="Student testimonial"
          />
        </label>
        {testimonial?.image_storage_path && (
          <p className="text-xs font-semibold text-gray-500">
            Current image: {testimonial.image_storage_path}
          </p>
        )}
        <label className={labelClass}>
          Student image
          <input name="testimonialImage" type="file" accept="image/*" className={controlClass} />
        </label>
        <PrimaryButton>Save testimonial</PrimaryButton>
      </form>
    </details>
  );
}

function InvoiceSection({
  bankDetailsReady,
  controlClass,
  invoiceClassOptions,
  invoiceCount,
  labelClass,
  lead,
}: {
  bankDetailsReady: boolean;
  controlClass: string;
  invoiceClassOptions: InvoiceClassOption[];
  invoiceCount: number;
  labelClass: string;
  lead: PteLeadTableRow;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isFetching, error } = useQuery({
    queryKey: ["pte-lead-invoices", lead.id],
    queryFn: () => fetchLeadInvoices(lead.id),
    enabled: isOpen,
  });
  const invoices = data?.invoices ?? [];

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="border border-gray-200 bg-white"
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Invoices ({invoiceCount})
      </summary>
      <div className="grid gap-3 border-t border-gray-200 p-4">
        {!bankDetailsReady && (
          <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Add invoice bank details before sending invoices.
          </p>
        )}
        <form action={createPteInvoice} className="grid gap-3 border border-gray-200 bg-gray-50 p-3 lg:grid-cols-[1fr_7rem_9rem_9rem_1fr_auto] lg:items-end">
          <input type="hidden" name="leadId" value={lead.id} />
          <label className={labelClass}>
            Class type
            <select name="invoiceClassType" defaultValue={lead.class_type} className={controlClass}>
              {invoiceClassOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.priceLabel})
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Classes
            <input name="classCount" type="number" min={1} max={100} defaultValue={1} required className={controlClass} />
          </label>
          <label className={labelClass}>
            Service date
            <input name="serviceDate" type="date" className={controlClass} />
          </label>
          <label className={labelClass}>
            Due date
            <input name="dueDate" type="date" className={controlClass} />
          </label>
          <label className={labelClass}>
            Notes
            <input name="invoiceNotes" type="text" placeholder="Optional invoice note" className={controlClass} />
          </label>
          <PrimaryButton>Generate</PrimaryButton>
        </form>

        {isFetching && <p className="text-sm text-gray-500">Loading invoices...</p>}
        {error && <p className="text-sm text-red-700">{(error as Error).message}</p>}
        {!isFetching && invoices.length === 0 && (
          <p className="border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
            No invoices yet.
          </p>
        )}
        {invoices.map((invoice) => (
          <div key={invoice.id} className="grid gap-3 border border-gray-200 px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-blue-900">{invoice.invoice_number}</p>
                <span className="border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {invoice.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">
                {invoice.class_count} x {invoice.class_label} · {formatMoney(Number(invoice.total_amount))}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Service {formatInvoiceDate(invoice.service_date)} · Due {formatInvoiceDate(invoice.due_date)}
                {invoice.pdf_storage_path ? " · PDF saved" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {invoice.status === "draft" && (
                <form action={sendPteInvoice}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <PrimaryButton disabled={!bankDetailsReady}>Send</PrimaryButton>
                </form>
              )}
              {invoice.status === "sent" && (
                <form action={markPteInvoicePaid}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <SecondarySubmitButton>Mark paid</SecondarySubmitButton>
                </form>
              )}
              {invoice.status === "paid" && (
                <form action={markPteInvoiceUnpaid}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <SecondarySubmitButton>Mark unpaid</SecondarySubmitButton>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function PteLeadsTable({
  initialRows,
  initialTotal,
  invoiceClassOptions,
  bankDetailsReady,
}: {
  initialRows: PteLeadTableRow[];
  initialTotal: number;
  invoiceClassOptions: InvoiceClassOption[];
  bankDetailsReady: boolean;
}) {
  const [page, setPage] = useState(1);
  const [studentQuery, setStudentQuery] = useState("");
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "created_at",
    direction: "desc",
  });
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const { data, isFetching, error } = useQuery({
    queryKey: ["pte-leads", page, studentQuery, invoiceQuery, statusFilter, sort],
    queryFn: () => fetchLeads({ page, studentQuery, invoiceQuery, statusFilter, sort }),
    initialData:
      page === 1 && !studentQuery && !invoiceQuery && !statusFilter
      && sort.key === "created_at" && sort.direction === "desc"
        ? { leads: initialRows, page: 1, pageSize: 25, total: initialTotal }
        : undefined,
  });
  const sortedRows = useMemo(() => {
    if (sort.key !== "status") {
      return data?.leads ?? [];
    }

    return [...(data?.leads ?? [])].sort((a, b) => {
      const aValue = getSortableValue(a, sort.key);
      const bValue = getSortableValue(b, sort.key);
      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));

      return sort.direction === "asc" ? result : -result;
    });
  }, [data?.leads, sort]);
  const table = useTable({ features, columns, data: sortedRows });
  const rows = table.getRowModel().rows;
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual manages row measurement internally.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 8,
  });
  const totalPages = Math.max(Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 25)), 1);
  const toggleSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };
  const controlClass =
    "border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2";
  const labelClass = "grid gap-1 text-sm font-semibold text-gray-800";
  const rowGridClass =
    "grid min-w-[78rem] grid-cols-[3.5rem_minmax(15rem,1.6fr)_minmax(9rem,1fr)_minmax(6rem,0.7fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(11rem,1fr)_minmax(5rem,0.6fr)]";

  return (
    <section className="grid gap-4" aria-label="PTE student table">
      <div className="border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100/60">
        <div className="grid gap-3 lg:grid-cols-[1fr_14rem_14rem_auto] lg:items-end">
          <label className={labelClass}>
            Search students
            <input
              type="search"
              value={studentQuery}
              onChange={(event) => {
                setStudentQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Name or email"
              className={controlClass}
            />
          </label>
          <label className={labelClass}>
            Invoice
            <input
              type="search"
              value={invoiceQuery}
              onChange={(event) => {
                setInvoiceQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Invoice number"
              className={controlClass}
            />
          </label>
          <label className={labelClass}>
            Quick filter
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className={controlClass}
            >
              <option value="">All students</option>
              <option value="needs-follow-up">Needs follow-up</option>
              <option value="followed-up">Followed up</option>
              <option value="follow-up-due">Follow-up due</option>
              <option value="booked">Booking set</option>
              <option value="not-booked">No booking</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <p className="text-sm font-semibold text-gray-500" aria-live="polite">
            {isFetching ? "Loading..." : `${data?.total ?? 0} students`}
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error).message}
        </div>
      )}

      <div className="overflow-hidden border border-gray-200 bg-white shadow-sm shadow-gray-100/60">
        <div className="overflow-x-auto">
          <div className="min-w-[78rem] text-left text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className={`${rowGridClass} border-b border-gray-200 bg-gray-50`}>
                <div className="px-4 py-3 font-semibold text-gray-700">
                  <span className="sr-only">Expand row</span>
                </div>
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    aria-sort={
                      isSortKey(header.id) && sort.key === header.id
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700"
                  >
                    {header.isPlaceholder ? null : isSortKey(header.id) ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isSortKey(header.id)) {
                            toggleSort(header.id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-left font-semibold text-gray-700 transition-colors hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
                      >
                        <table.FlexRender header={header} />
                        {sort.key === header.id && (
                          <PhosphorIcon
                            name={sort.direction === "asc" ? "caret-up" : "caret-down"}
                            size={13}
                            className="text-blue-900"
                          />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        <div ref={parentRef} className="max-h-[42rem] min-w-[78rem] overflow-y-auto overflow-x-hidden">
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const lead = row.original;
              const invoices = lead.pte_invoices ?? [];
              const isExpanded = expandedLeadId === lead.id;

              return (
                <div
                  key={row.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  className={`absolute left-0 w-full border-b border-gray-100 bg-white transition-colors ${
                    isExpanded ? "shadow-[inset_3px_0_0_#1e3a8a]" : "hover:bg-gray-50"
                  }`}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <div className={`${rowGridClass} items-center text-sm`}>
                    <div className="flex justify-center px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${lead.first_name} ${lead.last_name}`}
                        className="inline-flex h-8 w-8 items-center justify-center border border-gray-300 bg-white text-gray-600 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
                      >
                        <PhosphorIcon name={isExpanded ? "caret-up" : "caret-down"} size={16} />
                      </button>
                    </div>
                    <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-900">
                        {getInitials(lead)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-950">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="truncate text-xs text-gray-500">{lead.email}</p>
                      </div>
                    </div>
                    <div className="truncate px-4 py-3 text-gray-700">{lead.class_label}</div>
                    <div className="truncate px-4 py-3 font-semibold text-gray-800">{formatScoreGoal(lead.score_goal)}</div>
                    <div className="px-4 py-3"><StatusBadge lead={lead} /></div>
                    <div className="truncate px-4 py-3 text-gray-600">{formatDateTime(lead.created_at)}</div>
                    <div className="truncate px-4 py-3 text-gray-600">{formatDateTime(lead.next_follow_up_at)}</div>
                    <div className="truncate px-4 py-3 text-gray-600">{formatNextBooking(lead.first_session_at)}</div>
                    <div className="px-4 py-3 text-sm font-semibold text-gray-700">{invoices.length}</div>
                  </div>

                  {isExpanded && (
                    <div className="grid gap-4 border-t border-gray-200 bg-gray-50 px-4 py-5">
                      <section className="grid gap-4 border border-gray-200 bg-white p-4 lg:grid-cols-4">
                        <DetailItem label="Phone" value={lead.phone || "Not provided"} />
                        <DetailItem label="Improvement areas" value={formatValueList(lead.focus_areas)} />
                        <DetailItem
                          label="Availability"
                          value={<AvailabilityOverviewButton availability={lead.availability} leadId={lead.id} />}
                        />
                        <DetailItem label="Next booking" value={formatNextBooking(lead.first_session_at)} />
                      </section>

                      <form action={sendPteStudentAccountInvite} className="flex flex-wrap items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 p-4">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">Student dashboard access</p>
                          <p className="mt-1 text-xs text-emerald-800">
                            Email {lead.first_name} a secure link to set a password and open their dashboard.
                          </p>
                        </div>
                        <SecondarySubmitButton>Send dashboard invite</SecondarySubmitButton>
                      </form>

                      <BookingSection lead={lead} controlClass={controlClass} labelClass={labelClass} />

                      <form action={updatePteLead} className="grid gap-4 border border-gray-200 bg-white p-4">
                        <input type="hidden" name="id" value={lead.id} />
                        {lead.first_session_booked && <input type="hidden" name="firstSessionBooked" value="true" />}
                        {lead.first_session_at && <input type="hidden" name="firstSessionAt" value={toDatetimeLocal(lead.first_session_at)} />}
                        {lead.payment_received && <input type="hidden" name="paymentReceived" value="true" />}
                        <div className="flex flex-wrap gap-3">
                          {lead.followed_up ? (
                            <input type="hidden" name="followedUp" value="true" />
                          ) : (
                            <label className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
                              <input name="followedUp" type="checkbox" className="h-4 w-4" />
                              Mark followed up
                            </label>
                          )}
                        </div>
                        <AdminAvailabilityEditor key={lead.id} initialAvailability={lead.availability} leadId={lead.id} />
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                          <label className={labelClass}>
                            Notes
                            <input name="notes" type="text" defaultValue={lead.notes} className={controlClass} placeholder="Student notes" />
                          </label>
                          <PrimaryButton>Save</PrimaryButton>
                        </div>
                      </form>

                      <TestimonialSection lead={lead} controlClass={controlClass} labelClass={labelClass} />

                      <InvoiceSection
                        bankDetailsReady={bankDetailsReady}
                        controlClass={controlClass}
                        invoiceClassOptions={invoiceClassOptions}
                        invoiceCount={invoices.length}
                        labelClass={labelClass}
                        lead={lead}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-white p-3 text-sm shadow-sm shadow-gray-100/60">
        <p className="font-semibold text-gray-600">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page <= 1} className="border border-gray-300 bg-white px-3 py-1.5 font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50">
            Previous
          </button>
          <button type="button" onClick={() => setPage((value) => Math.min(value + 1, totalPages))} disabled={page >= totalPages} className="border border-gray-300 bg-white px-3 py-1.5 font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
