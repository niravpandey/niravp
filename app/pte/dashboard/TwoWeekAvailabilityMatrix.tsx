"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { availabilityTimeSlots } from "../components/pteContent";
import { cx } from "../components/pteUi";

type AvailabilityTimeSlot = (typeof availabilityTimeSlots)[number];

export type TwoWeekAvailabilityDay = {
  date: string;
  label: string;
  shortLabel: string;
};

export function TwoWeekAvailabilityMatrix({
  days,
  disabledAvailability = [],
  selectedAvailability,
  onAvailabilityChange,
}: {
  days: TwoWeekAvailabilityDay[];
  disabledAvailability?: string[];
  selectedAvailability: string[];
  onAvailabilityChange: Dispatch<SetStateAction<string[]>>;
}) {
  const [dragMode, setDragMode] = useState<"select" | "clear" | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{
    date: string;
    hourLabel: string;
  } | null>(null);
  const hourGroups = getAvailabilityHourGroups();
  const disabledAvailabilitySet = new Set(disabledAvailability);
  const allAvailabilityValues = days.flatMap((day) =>
    availabilityTimeSlots.map((slot) => getAvailabilityValue(day.date, slot.value)),
  );
  const enabledAvailabilityValues = allAvailabilityValues.filter(
    (value) => !disabledAvailabilitySet.has(value),
  );

  function updateAvailabilityValue(value: string, shouldSelect: boolean) {
    if (disabledAvailabilitySet.has(value)) {
      return;
    }

    if (shouldSelect) {
      onAvailabilityChange((current) =>
        current.includes(value) ? current : [...current, value],
      );
      return;
    }

    onAvailabilityChange((current) => current.filter((item) => item !== value));
  }

  return (
    <div className="grid gap-2">
      {selectedAvailability.filter((value) => !disabledAvailabilitySet.has(value)).map((value) => (
        <input key={value} type="hidden" name="availability" value={value} />
      ))}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onAvailabilityChange(enabledAvailabilityValues)}
          className="border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => onAvailabilityChange([])}
          className="border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          Clear
        </button>
      </div>

      <div
        className="mx-auto max-h-[17rem] w-max min-w-[43rem] overflow-auto border border-gray-200 bg-gray-100"
        onPointerLeave={() => {
          setDragMode(null);
          setHoveredSlot(null);
        }}
        onPointerUp={() => setDragMode(null)}
      >
        <table className="border-separate border-spacing-0 bg-white">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 h-8 w-10 border-r border-b border-gray-200 bg-gray-50 px-1 py-0.5" aria-label="Time" />
              {days.map((day) => (
                <th
                  key={day.date}
                  title={day.label}
                  scope="col"
                  className={cx(
                    "sticky top-0 z-20 h-8 w-12 border-r border-b border-gray-200 bg-gray-50 px-0.5 py-0.5 text-center text-[0.55rem] font-semibold leading-tight transition-colors",
                    hoveredSlot?.date === day.date
                      ? "text-emerald-700"
                      : "text-blue-900",
                  )}
                >
                  {day.shortLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourGroups.map((group) => (
              <tr key={group.hourLabel}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 h-7 w-10 border-r border-b border-gray-200 bg-gray-50 px-1 py-0.5 text-left"
                >
                  <span
                    className={cx(
                      "text-[0.6rem] font-semibold transition-colors",
                      hoveredSlot?.hourLabel === group.hourLabel
                        ? "text-emerald-700"
                        : "text-gray-900",
                    )}
                  >
                    {group.hourLabel}
                  </span>
                </th>

                {days.map((day) => (
                  <AvailabilityHourCell
                    key={`${day.date}-${group.hourLabel}`}
                    day={day}
                    disabledAvailability={disabledAvailabilitySet}
                    dragMode={dragMode}
                    slots={group.slots}
                    selectedAvailability={selectedAvailability}
                    onDragModeChange={setDragMode}
                    onHoverChange={(date) =>
                      setHoveredSlot(date ? { date, hourLabel: group.hourLabel } : null)
                    }
                    onSlotDrag={updateAvailabilityValue}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getAvailabilityHourGroups() {
  const groups: Array<{ hourLabel: string; slots: AvailabilityTimeSlot[] }> = [];

  for (let index = 0; index < availabilityTimeSlots.length; index += 2) {
    const firstSlot = availabilityTimeSlots[index];

    if (!firstSlot) {
      continue;
    }

    groups.push({
      hourLabel: firstSlot.label.replace(":00 ", " "),
      slots: availabilityTimeSlots.slice(index, index + 2),
    });
  }

  return groups;
}

function getAvailabilityValue(date: string, slotValue: string) {
  return `${date}-${slotValue}`;
}

function AvailabilityHourCell({
  day,
  disabledAvailability,
  dragMode,
  slots,
  selectedAvailability,
  onDragModeChange,
  onHoverChange,
  onSlotDrag,
}: {
  day: TwoWeekAvailabilityDay;
  disabledAvailability: Set<string>;
  dragMode: "select" | "clear" | null;
  slots: AvailabilityTimeSlot[];
  selectedAvailability: string[];
  onDragModeChange: (mode: "select" | "clear" | null) => void;
  onHoverChange: (date: string | null) => void;
  onSlotDrag: (value: string, shouldSelect: boolean) => void;
}) {
  return (
    <td className="h-7 w-12 border-r border-b border-gray-200 bg-gray-100 p-0 align-middle">
      <div className="grid min-h-7 grid-rows-2 bg-gray-100">
        {slots.map((slot) => {
          const value = getAvailabilityValue(day.date, slot.value);
          const isSelected = selectedAvailability.includes(value);
          const isDisabled = disabledAvailability.has(value);

          return (
            <button
              key={slot.value}
              type="button"
              aria-disabled={isDisabled}
              aria-pressed={isSelected && !isDisabled}
              aria-label={`${day.label} ${slot.label}${isDisabled ? " unavailable" : ""}`}
              disabled={isDisabled}
              title={`${day.label} ${slot.label}${isDisabled ? " unavailable from Nirav's calendar" : ""}`}
              onPointerDown={(event) => {
                if (isDisabled) {
                  return;
                }

                if (event.pointerType === "mouse" && event.button !== 0) {
                  return;
                }

                event.preventDefault();
                const shouldSelect = !isSelected;
                onDragModeChange(shouldSelect ? "select" : "clear");
                onSlotDrag(value, shouldSelect);
              }}
              onPointerEnter={() => {
                onHoverChange(day.date);

                if (!dragMode || isDisabled) {
                  return;
                }

                onSlotDrag(value, dragMode === "select");
              }}
              onFocus={() => onHoverChange(day.date)}
              onBlur={() => onHoverChange(null)}
              onPointerUp={() => onDragModeChange(null)}
              className={cx(
                "min-h-[0.86rem] transition-colors focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1",
                isDisabled
                  ? "cursor-not-allowed bg-gray-300 opacity-80"
                  : isSelected
                    ? "bg-emerald-700 hover:bg-emerald-600"
                    : "bg-white hover:bg-emerald-50",
              )}
            />
          );
        })}
      </div>
    </td>
  );
}
