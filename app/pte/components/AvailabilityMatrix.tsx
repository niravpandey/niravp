"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { availabilityDays, availabilityTimeSlots } from "./pteContent";
import { cx } from "./pteUi";

type AvailabilityTimeSlot = (typeof availabilityTimeSlots)[number];

export function AvailabilityMatrix({
  active = true,
  selectedAvailability,
  onAvailabilityChange,
}: {
  active?: boolean;
  selectedAvailability: string[];
  onAvailabilityChange: Dispatch<SetStateAction<string[]>>;
}) {
  const [dragMode, setDragMode] = useState<"select" | "clear" | null>(null);
  const [guideFrame, setGuideFrame] = useState(1);
  const [hasDismissedGuide, setHasDismissedGuide] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{
    day: (typeof availabilityDays)[number];
    hourLabel: string;
  } | null>(null);
  const hourGroups = getAvailabilityHourGroups();
  const allAvailabilityValues = availabilityDays.flatMap((day) =>
    availabilityTimeSlots.map((slot) => getAvailabilityValue(day, slot.value)),
  );
  const showSelectionGuide =
    active && selectedAvailability.length === 0 && !hasDismissedGuide;

  useEffect(() => {
    if (!showSelectionGuide) {
      return;
    }

    const guideInterval = window.setInterval(() => {
      setGuideFrame((currentFrame) => (currentFrame % 10) + 1);
    }, 260);

    return () => {
      window.clearInterval(guideInterval);
    };
  }, [showSelectionGuide]);

  useEffect(() => {
    if (!showSelectionGuide) {
      return;
    }

    function dismissGuide() {
      setHasDismissedGuide(true);
    }

    document.addEventListener("pointerdown", dismissGuide, { once: true });

    return () => {
      document.removeEventListener("pointerdown", dismissGuide);
    };
  }, [showSelectionGuide]);

  function updateAvailabilityValue(value: string, shouldSelect: boolean) {
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
      {selectedAvailability.map((value) => (
        <input key={value} type="hidden" name="availability" value={value} />
      ))}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onAvailabilityChange(allAvailabilityValues)}
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

      <div className="mx-auto w-max min-w-[17.75rem]">
        <div
          className="max-h-[15.5rem] overflow-auto border border-gray-200 bg-gray-100"
          onPointerLeave={() => {
            setDragMode(null);
            setHoveredSlot(null);
          }}
          onPointerUp={() => setDragMode(null)}
        >
          <div className="sticky top-0 z-20 grid grid-cols-[2.5rem_repeat(7,2.15rem)] gap-px border-b border-gray-200 bg-gray-200">
            <div className="px-1 py-0.5" aria-hidden="true" />
            {availabilityDays.map((day) => (
              <div
                key={day}
                className={cx(
                  "bg-gray-50 px-0.5 py-0.5 text-center text-[0.6rem] font-semibold transition-transform transition-colors",
                  hoveredSlot?.day === day
                    ? "scale-110 font-bold text-emerald-700"
                    : "text-blue-900",
                )}
              >
                {day.slice(0, 3).toUpperCase()}
              </div>
            ))}
          </div>

          {hourGroups.map((group) => (
            <div
              key={group.hourLabel}
              className="grid grid-cols-[2.5rem_repeat(7,2.15rem)] gap-px border-b border-gray-200 bg-gray-200 last:border-b-0"
            >
              <div className="sticky left-0 z-10 flex min-h-7 items-center bg-gray-50 px-1 py-0.5">
                <span
                  className={cx(
                    "text-[0.6rem] font-semibold transition-transform transition-colors",
                    hoveredSlot?.hourLabel === group.hourLabel
                      ? "scale-110 font-bold text-emerald-700"
                      : "text-gray-900",
                  )}
                >
                  {group.hourLabel}
                </span>
              </div>

              {availabilityDays.map((day) => (
                <AvailabilityHourCell
                  key={`${day}-${group.hourLabel}`}
                  day={day}
                  dragMode={dragMode}
                  guideFrame={guideFrame}
                  showSelectionGuide={showSelectionGuide}
                  slots={group.slots}
                  selectedAvailability={selectedAvailability}
                  onDragModeChange={setDragMode}
                  onHoverChange={(dayValue) =>
                    setHoveredSlot(dayValue ? { day: dayValue, hourLabel: group.hourLabel } : null)
                  }
                  onSlotDrag={updateAvailabilityValue}
                />
              ))}
            </div>
          ))}
        </div>
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

function getAvailabilityValue(day: (typeof availabilityDays)[number], slotValue: string) {
  return `${day.toLowerCase()}-${slotValue}`;
}

function AvailabilityHourCell({
  day,
  dragMode,
  guideFrame,
  showSelectionGuide,
  slots,
  selectedAvailability,
  onDragModeChange,
  onHoverChange,
  onSlotDrag,
}: {
  day: (typeof availabilityDays)[number];
  dragMode: "select" | "clear" | null;
  guideFrame: number;
  showSelectionGuide: boolean;
  slots: AvailabilityTimeSlot[];
  selectedAvailability: string[];
  onDragModeChange: (mode: "select" | "clear" | null) => void;
  onHoverChange: (day: (typeof availabilityDays)[number] | null) => void;
  onSlotDrag: (value: string, shouldSelect: boolean) => void;
}) {
  return (
    <div className="grid min-h-7 grid-rows-2 gap-px bg-gray-100">
      {slots.map((slot) => {
        const value = getAvailabilityValue(day, slot.value);
        const isSelected = selectedAvailability.includes(value);
        const guideOrder = showSelectionGuide ? getAvailabilityGuideOrder(day, slot.value) : null;
        const guideCellState =
          guideOrder === null ? null : getAvailabilityGuideCellState(guideOrder, guideFrame);
        const guideBackgroundColor =
          guideCellState === "bright"
            ? "rgb(52 211 153)"
            : guideCellState === "dim"
              ? "rgb(167 243 208)"
              : undefined;

        return (
          <button
            key={slot.value}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${day} ${slot.label}`}
            title={`${day} ${slot.label}`}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse" && event.button !== 0) {
                return;
              }

              event.preventDefault();
              const shouldSelect = !isSelected;
              onDragModeChange(shouldSelect ? "select" : "clear");
              onSlotDrag(value, shouldSelect);
            }}
            onPointerEnter={() => {
              onHoverChange(day);

              if (!dragMode) {
                return;
              }

              onSlotDrag(value, dragMode === "select");
            }}
            onFocus={() => onHoverChange(day)}
            onBlur={() => onHoverChange(null)}
            onPointerUp={() => onDragModeChange(null)}
            className={cx(
              "min-h-[0.86rem] transition-colors focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1",
              isSelected
                ? "bg-emerald-700 hover:bg-emerald-600"
                : "bg-white hover:bg-emerald-50",
            )}
            style={
              guideBackgroundColor
                ? { backgroundColor: guideBackgroundColor }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

function getAvailabilityGuideOrder(
  day: (typeof availabilityDays)[number],
  slotValue: string,
) {
  const mondaySlots = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"];

  if (day !== "Monday") {
    return null;
  }

  const index = mondaySlots.indexOf(slotValue);
  return index === -1 ? null : index;
}

function getAvailabilityGuideCellState(guideOrder: number, guideFrame: number) {
  if (guideFrame >= 1 && guideFrame <= 6) {
    return guideOrder < guideFrame ? "dim" : null;
  }

  if (guideFrame === 7 || guideFrame === 9) {
    return "bright";
  }

  if (guideFrame === 8) {
    return "dim";
  }

  return null;
}
