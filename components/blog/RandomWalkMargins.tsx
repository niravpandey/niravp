"use client";

import { useEffect, useRef } from "react";
import { LINE_COLOR, WALKERS_PER_SIDE } from "@/components/blog/randomWalkConfig";

// Below this window width the walks would sit behind the text, so they're turned off. Matches Tailwind's md breakpoint.
const MIN_WIDTH = 768;

const SEED = 20051;
const STEPS_PER_WALKER = 2000;
const STEP = 3;
// Walks from both sides end within this fraction of the window width around the centre.
const MEET_SPREAD = 0.12;
// How strongly a walk steers towards its end point; lower values wander more and may fall short.
const STEERING = 0.9;
const LINE_ALPHA = 0.08;

/** Small seeded PRNG (mulberry32): the same seed gives the same walks on every device. */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Points for one walk as [x0, y0, x1, y1, ...], starting at its edge and ending near the middle.
 * At each step the inward bias is whatever it takes to reach the end point in the steps left,
 * so the walk stays random but arrives on time.
 */
function buildWalk(random: () => number, side: "left" | "right", width: number, height: number) {
  const points = new Float32Array((STEPS_PER_WALKER + 1) * 2);
  const target = width / 2 + (random() - 0.5) * width * MEET_SPREAD;
  let depth = 0;
  let y = random() * height;

  for (let i = 0; i <= STEPS_PER_WALKER; i++) {
    points[i * 2] = side === "left" ? depth : width - depth;
    points[i * 2 + 1] = y;

    // About half the remaining steps are horizontal.
    const horizontalStepsLeft = Math.max((STEPS_PER_WALKER - i) / 2, 1);
    const neededRate = Math.min(Math.max((target - depth) / (horizontalStepsLeft * STEP), -1), 1);
    if (random() < 0.5) depth = Math.max(depth + (random() < 0.5 + 0.5 * STEERING * neededRate ? STEP : -STEP), 0);
    else y += random() < 0.5 ? STEP : -STEP;
  }
  return points;
}

/**
 * Faint violet-mauve random walks that creep in from both page edges as you scroll down and meet
 * around the middle at the bottom of the page, then unwind back to the edges as you scroll up.
 * How much of each walk is drawn depends only on scroll position. Drawn on a fixed canvas behind
 * the content, only on windows wide enough to leave margins beside the text.
 */
export default function RandomWalkMargins() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    let walks: Float32Array[] = [];
    let drawnSteps = 0;
    let frame = 0;

    const strokeRange = (from: number, to: number) => {
      ctx.strokeStyle = LINE_COLOR;
      ctx.globalAlpha = LINE_ALPHA;
      ctx.lineWidth = 1;
      // One stroke per walk, so overlapping walks build up a slightly denser texture.
      for (const points of walks) {
        ctx.beginPath();
        ctx.moveTo(points[from * 2], points[from * 2 + 1]);
        for (let i = from + 1; i <= to; i++) ctx.lineTo(points[i * 2], points[i * 2 + 1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - height;
      const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
      const steps = Math.round(progress * STEPS_PER_WALKER);
      if (steps === drawnSteps) return;

      // Scrolling down only adds the new segments; scrolling up redraws the shorter walks from scratch.
      if (steps > drawnSteps) {
        strokeRange(drawnSteps, steps);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (steps > 0) strokeRange(0, steps);
      }
      drawnSteps = steps;
    };

    const requestDraw = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const random = seededRandom(SEED);
      walks = [];
      if (width >= MIN_WIDTH) {
        for (let i = 0; i < WALKERS_PER_SIDE; i++) {
          walks.push(buildWalk(random, "left", width, height), buildWalk(random, "right", width, height));
        }
      }
      // Resizing the canvas clears it, so the next draw starts from nothing.
      drawnSteps = 0;
      requestDraw();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", requestDraw, { passive: true });
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", requestDraw);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full blur-[0.5px]" />;
}
