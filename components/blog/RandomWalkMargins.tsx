"use client";

import { useEffect, useRef } from "react";
import { WALKERS_PER_SIDE } from "@/components/blog/randomWalkConfig";

// Below this window width the walks would sit behind the text, so they're turned off. Matches Tailwind's md breakpoint.
const MIN_WIDTH = 768;

const SEED = 20051;
const STEPS_PER_WALKER = 2000;
const STEP = 3;
// Walks from both sides end within this fraction of the window width around the centre.
const MEET_SPREAD = 0.12;
// How strongly a walk steers towards its end point; lower values wander more and may fall short.
const STEERING = 0.9;
// Opacity of the paths (scaled by the palette's `--walk-opacity`).
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
 * Random walks (in the palette's `--walk` color) behind the blog: each one runs from the page edge to near the middle,
 * drawn once as a still, faint web. Drawn on a fixed canvas behind the content, only on windows wide enough to leave
 * margins beside the text.
 */
export default function RandomWalkMargins() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let walks: Float32Array[] = [];
    // Line color and opacity come from the palette tokens `--walk` / `--walk-opacity` on <html>.
    let lineColor = "currentColor";
    let opacity = 1;
    const readPalette = () => {
      const styles = getComputedStyle(document.documentElement);
      lineColor = styles.getPropertyValue("--walk").trim() || "currentColor";
      const parsed = parseFloat(styles.getPropertyValue("--walk-opacity"));
      opacity = Number.isFinite(parsed) ? parsed : 1;
    };

    // One stroke per walk, so overlapping walks build up a slightly denser texture.
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = Math.min(LINE_ALPHA * opacity, 1);
      for (const points of walks) {
        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);
        for (let i = 1; i <= STEPS_PER_WALKER; i++) ctx.lineTo(points[i * 2], points[i * 2 + 1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
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
      draw();
    };

    // Redraw in the new colors when the palette on <html> changes.
    const paletteObserver = new MutationObserver(() => {
      readPalette();
      draw();
    });
    paletteObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "style", "class"] });

    readPalette();
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      paletteObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full blur-[0.5px]" />;
}
