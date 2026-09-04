"use client";

import { useActionState, useState } from "react";
import type { SetStateAction } from "react";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { updateStudentAvailability, type StudentAvailabilityState } from "./actions";
import { TwoWeekAvailabilityMatrix, type TwoWeekAvailabilityDay } from "./TwoWeekAvailabilityMatrix";

const initialState: StudentAvailabilityState | null = null;
const minimumAvailabilitySlots = 6;

export default function StudentAvailabilityEditor({
  blockedAvailability,
  days,
  initialAvailability,
}: {
  blockedAvailability: string[];
  days: TwoWeekAvailabilityDay[];
  initialAvailability: string[];
}) {
  const blockedSet = new Set(blockedAvailability);
  const [selectedAvailability, setSelectedAvailability] = useState(
    initialAvailability.filter((value) => !blockedSet.has(value)),
  );
  const [clientValidationMessage, setClientValidationMessage] = useState("");
  const [state, formAction, isPending] = useActionState(updateStudentAvailability, initialState);
  const selectedAvailableCount = selectedAvailability.filter((value) => !blockedSet.has(value)).length;

  function handleAvailabilityChange(action: SetStateAction<string[]>) {
    setClientValidationMessage("");
    setSelectedAvailability(action);
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const availableValues = selectedAvailability.filter((value) => !blockedSet.has(value));
        const isolatedAvailabilityCount = getIsolatedAvailabilityValues(availableValues).length;

        if (selectedAvailableCount < minimumAvailabilitySlots) {
          event.preventDefault();
          setClientValidationMessage("Please select at least 3 hours of availability before saving.");
          return;
        }

        if (isolatedAvailabilityCount > 0) {
          event.preventDefault();
          setClientValidationMessage("Each available block must be at least 1 hour. Remove or extend any single 30 minute selections.");
        }
      }}
      className="mt-6 grid gap-3 border border-gray-200 bg-gray-50 p-3"
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">Update your availability</p>
        <p className="mt-1 text-sm text-gray-600">
          Save the times that work for you over the next two weeks. Grey blocks are unavailable from Nirav&apos;s calendar.
        </p>
      </div>

      {clientValidationMessage ? (
        <p className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          <PhosphorIcon name="warning-circle" size={16} className="mt-0.5 shrink-0" />
          <span>{clientValidationMessage}</span>
        </p>
      ) : null}

      <div className="overflow-x-auto pb-1">
        <TwoWeekAvailabilityMatrix
          days={days}
          disabledAvailability={blockedAvailability}
          selectedAvailability={selectedAvailability}
          onAvailabilityChange={handleAvailabilityChange}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-gray-500">
          {selectedAvailableCount} half-hour blocks selected
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isPending ? "Saving..." : "Save availability"}
        </button>
      </div>

      {state ? (
        <p className={state.success ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function getIsolatedAvailabilityValues(availability: string[]) {
  const values = new Set(availability);

  return availability.filter((value) => {
    const date = value.slice(0, 10);
    const time = value.slice(11);
    const [hour, minute] = time.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;
    const previousTotalMinutes = totalMinutes - 30;
    const nextTotalMinutes = totalMinutes + 30;
    const previous = `${date}-${String(Math.floor(previousTotalMinutes / 60)).padStart(2, "0")}:${String(previousTotalMinutes % 60).padStart(2, "0")}`;
    const next = `${date}-${String(Math.floor(nextTotalMinutes / 60)).padStart(2, "0")}:${String(nextTotalMinutes % 60).padStart(2, "0")}`;

    return !values.has(previous) && !values.has(next);
  });
}
