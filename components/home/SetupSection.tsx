"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { SETUP_IMAGE, setupItems } from "@/lib/setup";

/** My setup as one picture: hover (or tap) an item and a label appears beside it. */
export default function SetupSection() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = setupItems.find((item) => item.id === activeId) ?? null;

  // The label is pinned to the item: above it (below for items touching the top edge), centred on it,
  // or aligned to its outer edge near the sides so it never spills off narrow screens.
  let labelStyle: CSSProperties | undefined;
  if (active) {
    const { x, y, w, h } = active.area;
    const centre = x + w / 2;
    const below = y < 15;
    const align = centre < 25 ? "start" : centre > 75 ? "end" : "center";
    const left = align === "start" ? x : align === "end" ? x + w : centre;
    const shiftX = align === "start" ? "0%" : align === "end" ? "-100%" : "-50%";
    labelStyle = {
      left: `${left}%`,
      top: `${below ? y + h : y}%`,
      transform: `translate(${shiftX}, ${below ? "10px" : "calc(-100% - 10px)"})`,
    };
  }

  return (
    <section className="w-full border-b border-gray-200 py-8">
      <SectionHeading icon="code">My setup</SectionHeading>
      <p className="mt-2 text-sm text-mauve-500">The tech I use every day</p>

      <div
        className="relative mt-4 max-w-xl"
        style={{ aspectRatio: `${SETUP_IMAGE.width} / ${SETUP_IMAGE.height}` }}
        onMouseLeave={() => setActiveId(null)}
      >
        <Image
          src={SETUP_IMAGE.src}
          alt={`My setup: ${setupItems.map((item) => item.name).join(", ")}`}
          width={SETUP_IMAGE.width}
          height={SETUP_IMAGE.height}
          sizes="(max-width: 640px) 100vw, 576px"
          className="h-full w-full object-contain"
        />

        {/* Invisible hit areas over each item. */}
        {setupItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={`${item.name}: ${item.description}`}
            aria-pressed={item.id === activeId}
            onMouseEnter={() => setActiveId(item.id)}
            onFocus={() => setActiveId(item.id)}
            onClick={() => setActiveId(item.id)}
            className="absolute focus:outline-none"
            style={{
              left: `${item.area.x}%`,
              top: `${item.area.y}%`,
              width: `${item.area.w}%`,
              height: `${item.area.h}%`,
            }}
          />
        ))}

        {active && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-max max-w-56 rounded-lg bg-white px-3 py-2 shadow-lg ring-1 ring-black/5"
            style={labelStyle}
          >
            <p className="text-sm font-medium text-gray-900">{active.name}</p>
            <p className="mt-0.5 text-xs leading-snug text-gray-500">{active.description}</p>
          </div>
        )}
      </div>
    </section>
  );
}
