import { getPteCalendarTimeZone } from "@/lib/google/calendar";

type BookingRequest = {
  id: string;
  created_at: string;
  duration_minutes: number;
  requested_start_at: string;
  status: "pending" | "approved" | "declined";
  student_note: string;
};

type ConfirmedBooking = {
  id: string;
  booking_at: string;
  duration_minutes: number;
  google_calendar_event_link: string | null;
  meeting_url: string | null;
  status: "confirmed" | "cancelled" | "removed";
};

export default function StudentBookingStatusList({
  confirmedBookings,
  requests,
}: {
  confirmedBookings: ConfirmedBooking[];
  requests: BookingRequest[];
}) {
  const visibleRequests = requests
    .filter((request) => request.status === "pending" || request.status === "approved")
    .slice(0, 6);

  if (confirmedBookings.length === 0 && visibleRequests.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 grid gap-3 border border-gray-200 bg-white p-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">Your class requests</p>
        <p className="mt-1 text-sm text-gray-600">
          Pending requests are not final bookings. Confirmed bookings are listed separately with session links when available.
        </p>
      </div>

      {confirmedBookings.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Confirmed upcoming</p>
          {confirmedBookings.map((booking) => (
            <div key={booking.id} className="grid gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-emerald-950">{formatDateTime(booking.booking_at)}</p>
                <p className="mt-0.5 text-xs font-semibold text-emerald-800">{formatDuration(booking.duration_minutes)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {booking.meeting_url ? (
                  <a href={booking.meeting_url} target="_blank" rel="noreferrer" className="border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600">
                    Join Meet
                  </a>
                ) : null}
                {booking.google_calendar_event_link ? (
                  <a href={booking.google_calendar_event_link} target="_blank" rel="noreferrer" className="border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:border-emerald-700">
                    Calendar
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {visibleRequests.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Requests sent</p>
          {visibleRequests.map((request) => (
            <div key={request.id} className="border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-amber-950">{formatDateTime(request.requested_start_at)}</p>
                <span className={request.status === "approved" ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-amber-800"}>
                  {request.status === "approved" ? "Approved" : "Pending approval"}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-amber-800">{formatDuration(request.duration_minutes)}</p>
              {request.student_note ? (
                <p className="mt-1 text-xs text-amber-900">{request.student_note}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: getPteCalendarTimeZone(),
  }).format(new Date(value));
}

function formatDuration(durationMinutes: number) {
  return durationMinutes === 60 ? "1 hour" : "1 hour 30 min";
}
