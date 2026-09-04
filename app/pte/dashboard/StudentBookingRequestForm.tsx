"use client";

import { useActionState, useState } from "react";
import { createStudentBookingRequest, type StudentAvailabilityState } from "./actions";

export type StudentBookingOption = {
  compatibility: number;
  durationMinutes: 60 | 90;
  label: string;
  rank: number;
  value: string;
  windowLabel: string;
};

const initialState: StudentAvailabilityState | null = null;

export default function StudentBookingRequestForm({
  options,
}: {
  options: StudentBookingOption[];
}) {
  const [selectedTime, setSelectedTime] = useState(options[0]?.value ?? "");
  const [state, formAction, isPending] = useActionState(createStudentBookingRequest, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-3 border border-amber-200 bg-amber-50 p-3">
      <div>
        <p className="text-sm font-semibold text-amber-950">Request a class time</p>
        <p className="mt-1 text-sm text-amber-900">
          This sends a request, not a final booking. Times need at least 24 hours of notice; this week is prioritized over next week.
        </p>
      </div>

      {options.length > 0 ? (
        <>
          <input type="hidden" name="requestedStartAt" value={selectedTime} />
          <input
            type="hidden"
            name="durationMinutes"
            value={options.find((option) => option.value === selectedTime)?.durationMinutes ?? 90}
          />
          <div className="grid gap-2" role="radiogroup" aria-label="Recommended class times">
            {options.map((option) => {
              const isSelected = selectedTime === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedTime(option.value)}
                  className={`relative grid min-h-16 gap-1 border px-3 py-2 pr-20 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-blue-900 bg-blue-900 text-white"
                      : "border-amber-300 bg-white text-gray-900 hover:border-blue-900 hover:bg-blue-50"
                  }`}
                >
                  <span className="grid gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Rank {option.rank}{option.rank === 1 ? " · best fit" : ""}
                    </span>
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className={isSelected ? "text-xs font-semibold text-blue-100" : "text-xs font-semibold text-gray-500"}>
                      {option.windowLabel} · {formatDuration(option.durationMinutes)}
                    </span>
                  </span>
                  <CompatibilityScore value={option.compatibility} selected={isSelected} />
                </button>
              );
            })}
          </div>
          <label className="grid gap-1 text-sm font-semibold text-gray-800">
            Note
            <textarea
              name="studentNote"
              rows={3}
              maxLength={1000}
              className="resize-y border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15"
              placeholder="Optional message"
            />
          </label>
          <button
            type="submit"
            name="requestMode"
            value="recommended"
            disabled={isPending}
            className="w-fit border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isPending ? "Sending..." : "Send booking request"}
          </button>
        </>
      ) : (
        <p className="text-sm font-semibold text-amber-900">
          No requestable times are available right now. Update your availability above and try again.
        </p>
      )}

      <div className="mt-2 grid gap-3 border-t border-amber-200 pt-3">
        <div>
          <p className="text-sm font-semibold text-amber-950">Request another time</p>
          <p className="mt-1 text-sm text-amber-900">
            You can request a different time too. It still needs at least 24 hours of notice and must fit Nirav&apos;s calendar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <label className="grid gap-1 text-sm font-semibold text-gray-800">
            Date and time
            <input
              name="customStartAt"
              type="datetime-local"
              step={1800}
              className="border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-gray-800">
            Duration
            <select
              name="customDurationMinutes"
              defaultValue="60"
              className="border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15"
            >
              <option value="60">1 hour</option>
              <option value="90">1 hour 30 min</option>
            </select>
          </label>
          <button
            type="submit"
            name="requestMode"
            value="custom"
            disabled={isPending}
            className="w-fit border border-amber-700 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isPending ? "Sending..." : "Request custom time"}
          </button>
        </div>
      </div>

      {state ? (
        <p className={state.success ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function formatDuration(durationMinutes: 60 | 90) {
  return durationMinutes === 60 ? "1 hour" : "1 hour 30 min";
}

function CompatibilityScore({
  selected,
  value,
}: {
  selected: boolean;
  value: number;
}) {
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const displayScore = (progress / 10).toFixed(1);

  return (
    <span className="absolute right-3 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center" aria-label={`${displayScore} out of 10 compatibility score`}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={selected ? "rgba(255,255,255,0.22)" : "rgb(229 231 235)"}
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={selected ? "white" : "rgb(5 150 105)"}
          strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          strokeWidth="5"
        />
      </svg>
      <span className={`text-[0.68rem] font-bold tabular-nums ${selected ? "text-white" : "text-gray-900"}`}>
        {displayScore}
      </span>
    </span>
  );
}
