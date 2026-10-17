"use client";

import { useState, type CSSProperties } from "react";
import DeviceFrame from "@/components/ui/DeviceFrame";
import SectionHeading from "@/components/ui/SectionHeading";
import type { MapPlace, StudentMapData } from "@/lib/student-map";
import { cn, pluralize } from "@/lib/utils";

const ALL = "all";

// Colour schemes for the map panel. Counts are normalised to 0-1 against the selected view's
// largest country and interpolated from `low` to `high` (dim to bright on CRT, light to dark on e-ink).
const THEMES = {
  crt: {
    screen: "#0a110b", // panel background, also the border between countries
    empty: "#132019",
    low: [46, 122, 70],
    high: [140, 255, 160],
    outline: "#e6ffe9",
    ink: "#6fd487", // legend and tooltip text
    glow: "drop-shadow(0 0 2px rgb(140 255 160 / 0.45))",
    scanlines: true,
    font: "font-crt", // VT323 terminal font
    prompt: "> ",
  },
  eink: {
    screen: "#f1efe8",
    empty: "#dddad1",
    low: [196, 192, 182],
    high: [28, 28, 28],
    outline: "#000000",
    ink: "#55524b",
    glow: "none",
    scanlines: false,
    font: "font-mono",
    prompt: "",
  },
};

const THEME = THEMES.eink;

function normalise(students: number, maxStudents: number) {
  return maxStudents <= 1 ? 1 : (students - 1) / (maxStudents - 1);
}

function scaleColor(t: number) {
  // Start a little above the low end so a single student never fades into the empty countries.
  const share = 0.12 + 0.88 * t;
  const channels = THEME.low.map((low, i) => Math.round(low + (THEME.high[i] - low) * share));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

// CRT overlay: scanlines drift down, a faint refresh bar rolls over the screen, edges are vignetted.
const CRT_KEYFRAMES = `
@keyframes crt-scanlines { to { background-position: 0 3px, 0 0; } }
@keyframes crt-refresh { from { transform: translateY(-100%); } to { transform: translateY(560%); } }
@media (prefers-reduced-motion: reduce) { .crt-animated { animation: none !important; } }
`;

const CRT_SCANLINES: CSSProperties = {
  background:
    "repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.28) 0 1px, transparent 1px 3px), radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.55) 100%)",
  animation: "crt-scanlines 1.2s linear infinite",
};

const CRT_REFRESH_BAR: CSSProperties = {
  background: "linear-gradient(to bottom, transparent, rgb(140 255 160 / 0.07), transparent)",
  animation: "crt-refresh 7s linear infinite",
};

type Marker = MapPlace & { students: number };

export default function StudentMapSection({ map }: { map: StudentMapData | null }) {
  const [cohortId, setCohortId] = useState(ALL);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  if (!map) return null;

  const { width, height, countries, places, cohorts } = map;
  const selected = cohorts.length > 1 ? (cohorts.find((cohort) => cohort.id === cohortId) ?? null) : null;

  const counts: Record<string, number> = {};
  for (const cohort of selected ? [selected] : cohorts) {
    for (const [code, students] of Object.entries(cohort.counts)) counts[code] = (counts[code] ?? 0) + students;
  }

  const markers: Marker[] = Object.entries(counts)
    .map(([code, students]) => ({ ...places[code], students }))
    .sort((a, b) => b.students - a.students || a.name.localeCompare(b.name));
  const markerById = new Map(markers.map((marker) => [marker.id, marker]));
  const maxStudents = Math.max(1, ...markers.map((marker) => marker.students));
  const totalStudents = markers.reduce((sum, marker) => sum + marker.students, 0);

  const active = markers.find((marker) => marker.code === activeCode) ?? null;
  const activeOutline = active ? countries.find((country) => country.id === active.id) : undefined;

  const legendTicks = Array.from(new Set([1, Math.round((1 + maxStudents) / 2), maxStudents]));
  const legendGradient = `linear-gradient(to right, ${scaleColor(0)}, ${scaleColor(0.5)}, ${scaleColor(1)})`;

  function fillFor(id: string) {
    const marker = markerById.get(id);
    return marker ? scaleColor(normalise(marker.students, maxStudents)) : THEME.empty;
  }

  function codeFor(id: string) {
    return markerById.get(id)?.code ?? null;
  }

  return (
    <section className="w-full border-b border-gray-200 py-8">
      <SectionHeading icon="globe-hemisphere-west">Students around the world</SectionHeading>
      <p className="mt-2 text-sm text-mauve-500">
        {selected ? selected.title : "All classes"} · {pluralize(totalStudents, "student")} across{" "}
        {pluralize(markers.length, "country", "countries")}
      </p>

      {/* The map is shown on a Kindle-style device. SVG units are sized for ~60% scale. */}
      <DeviceFrame
        className="mt-4 max-w-xl"
        screenClassName={cn("p-3", THEME.font)}
        screenStyle={{ background: THEME.screen, color: THEME.ink }}
      >
        {THEME.scanlines && (
          // Horizontal scanlines plus a soft vignette, drawn over the whole screen.
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <style>{CRT_KEYFRAMES}</style>
            <div className="crt-animated absolute inset-0" style={CRT_SCANLINES} />
            <div className="crt-animated absolute inset-x-0 top-0 h-[18%]" style={CRT_REFRESH_BAR} />
          </div>
        )}
        {/* Class tabs live on the "screen", like a device menu bar. */}
        {cohorts.length > 1 && (
          <div className="mb-2 flex flex-wrap justify-center gap-1" role="group" aria-label="Choose a class">
            {[{ id: ALL, label: "All" }, ...cohorts].map((cohort) => {
              const isSelected = cohort.id === (selected?.id ?? ALL);
              return (
                <button
                  key={cohort.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setCohortId(cohort.id)}
                  className="border px-2 py-0.5 text-[11px] uppercase tabular-nums transition-colors"
                  style={{
                    borderColor: isSelected ? THEME.outline : "transparent",
                    background: isSelected ? THEME.outline : "transparent",
                    color: isSelected ? THEME.screen : THEME.ink,
                  }}
                >
                  {cohort.label}
                </button>
              );
            })}
          </div>
        )}

        {/* The map takes the height left between tabs and key, keeping its aspect ratio. */}
        <div className="min-h-0 flex-1">
          <div className="relative mx-auto h-full max-w-full" style={{ aspectRatio: `${width} / ${height}` }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-full w-full"
              style={{ filter: THEME.glow }}
              role="img"
              aria-label={`World map of students: ${markers.map((m) => `${m.name} ${m.students}`).join(", ")}`}
              onMouseLeave={() => setActiveCode(null)}
            >
              <g>
                {countries.map((country) => (
                  <path
                    key={country.id}
                    d={country.d}
                    className="transition-[fill] duration-300"
                    stroke={THEME.screen}
                    style={{ fill: fillFor(country.id) }}
                    strokeWidth={0.75}
                    onMouseEnter={() => setActiveCode(codeFor(country.id))}
                  />
                ))}
              </g>

              {activeOutline && (
                <path
                  d={activeOutline.d}
                  className="pointer-events-none fill-none"
                  stroke={THEME.outline}
                  strokeWidth={1.8}
                />
              )}

              {/* Countries too small for the base map (e.g. Hong Kong) still get a dot in their shade. */}
              {markers
                .filter((marker) => !marker.inBaseMap)
                .map((marker) => (
                  <circle
                    key={marker.code}
                    cx={marker.x}
                    cy={marker.y}
                    r={marker.code === activeCode ? 9 : 7.5}
                    stroke={THEME.screen}
                    style={{
                      fill: scaleColor(normalise(marker.students, maxStudents)),
                    }}
                    strokeWidth={1.5}
                    onMouseEnter={() => setActiveCode(marker.code)}
                  />
                ))}
            </svg>

            {active && (
              <div
                className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full border px-1.5 py-0.5 text-sm leading-tight whitespace-nowrap uppercase"
                style={{
                  background: THEME.screen,
                  borderColor: THEME.ink,
                  color: THEME.outline,
                  left: `${(active.x / width) * 100}%`,
                  top: `calc(${(active.y / height) * 100}% - 12px)`,
                }}
              >
                {THEME.prompt}
                {active.name} · {pluralize(active.students, "student")}
              </div>
            )}
          </div>
        </div>

        {/* Key centred under the map. */}
        <div className="mt-2 flex flex-col items-center text-xs leading-none uppercase">
          <p className="mb-1.5">Students</p>
          <div className="h-1.5 w-28 rounded-sm" style={{ background: legendGradient }} />
          <div className="relative mt-1 h-3 w-28 tabular-nums">
            {legendTicks.map((tick) => (
              <span
                key={tick}
                className="absolute -translate-x-1/2"
                style={{ left: `${normalise(tick, maxStudents) * 100}%` }}
              >
                {tick}
              </span>
            ))}
          </div>
        </div>
      </DeviceFrame>
    </section>
  );
}
