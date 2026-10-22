"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LINE_COLOR } from "@/components/blog/randomWalkConfig";

// Simple solid flower in a 24x24 viewBox: rounded petals around a filled centre.
const PETAL_COUNT = 10;
// A slim rounded petal pointing straight up from the centre (12, 12); slim enough that 10 stay distinct.
const PETAL_PATH = "M 12 12 C 10 9 10 2.5 12 1.5 C 14 2.5 14 9 12 12 Z";

/**
 * Small note at the bottom of blog pages explaining the lines in the background. Hidden whenever the walks are.
 * Once you reach the bottom of the page, where the walks meet, it fades in slowly with a small flower above it.
 * Scrolling back up fades it out. Clicking the flower spins it a full turn.
 */
export default function RandomWalkCaption() {
  const [visible, setVisible] = useState(false);
  const [turns, setTurns] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollHeight } = document.documentElement;
      // A few pixels of slack, since some browsers stop just short of the exact bottom.
      setVisible(window.scrollY + window.innerHeight >= scrollHeight - 8);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className={cn(
        "hidden flex-col items-center gap-2 pb-8 font-mono text-xs transition-opacity ease-in-out md:flex motion-reduce:hidden",
        visible ? "opacity-100 duration-2000" : "opacity-0 duration-700",
      )}
      style={{ color: LINE_COLOR }}
    >
      <button
        type="button"
        onClick={() => setTurns((count) => count + 1)}
        aria-label="Spin the flower"
        className="cursor-pointer rounded-full p-1"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="currentColor"
          className="h-4 w-4 transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${turns * 360}deg)` }}
        >
          {Array.from({ length: PETAL_COUNT }, (_, i) => (
            <path key={i} d={PETAL_PATH} transform={`rotate(${(360 / PETAL_COUNT) * i} 12 12)`} />
          ))}
          <circle cx={12} cy={12} r={2.5} />
        </svg>
      </button>
      <p className="text-center">
        analogous to my blog, this is a random walk of moving lines meeting in the middle as you read
      </p>
    </div>
  );
}
