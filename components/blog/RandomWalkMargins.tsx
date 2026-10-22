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
// Opacity of the full paths once revealed, and of a trail's head and tail (it fades along its length).
const LINE_ALPHA = 0.08;
const TRAIL_HEAD_ALPHA = 0.35;
const TRAIL_TAIL_ALPHA = 0.04;
// While scrolling, each walk shows only its latest moves, drawn in a few chunks to fade the trail.
const TRAIL_STEPS = 500;
// Over the last part of the journey the trails dim to the web's opacity, so they don't bunch up bright in the middle.
const DIM_FROM = 0.6;
const TRAIL_CHUNKS = 5;
// At the bottom of the page the trails backtrack over their whole paths. How long that takes, and how much
// faster it retracts when you scroll back up.
const BACKTRACK_MS = 1800;
const RETRACT_SPEEDUP = 2.5;
// How far down the page (as a fraction) the walks reach the middle and meet. Below that the full web stays out.
const MEET_AT = 0.7;

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

/** Ease in and out, for the backtrack. */
function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/**
 * Violet-mauve random walks behind the blog. As you scroll down, each walk shows only its latest 500 moves,
 * a fading trail creeping in from the page edge; scrolling up walks it back. When the walks meet in the
 * middle, 70% of the way down the page, each trail backtracks over its whole path so the full web spreads
 * across the screen and stays for the rest of the page; it retracts again when you scroll back above that. Drawn on a fixed canvas behind the
 * content, only on windows wide enough to leave margins beside the text.
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
    let frame = 0;
    // How far the trails have backtracked over their paths: 0 is just the trail, 1 is the whole path.
    let backtrack = 0;
    let lastTime = 0;

    // One stroke per walk, so overlapping walks build up a slightly denser texture.
    const strokeRange = (from: number, to: number, alpha: number) => {
      if (to <= from) return;
      ctx.globalAlpha = alpha;
      for (const points of walks) {
        ctx.beginPath();
        ctx.moveTo(points[from * 2], points[from * 2 + 1]);
        for (let i = from + 1; i <= to; i++) ctx.lineTo(points[i * 2], points[i * 2 + 1]);
        ctx.stroke();
      }
    };

    const draw = (time: number) => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - height;
      const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
      const head = Math.round(Math.min(progress / MEET_AT, 1) * STEPS_PER_WALKER);
      const trailStart = Math.max(0, head - TRAIL_STEPS);

      // Move the backtrack towards fully out once the walks have met, or back in above that.
      const target = head >= STEPS_PER_WALKER ? 1 : 0;
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
      lastTime = time;
      if (backtrack < target) backtrack = Math.min(target, backtrack + elapsed / BACKTRACK_MS);
      else if (backtrack > target) backtrack = Math.max(target, backtrack - (elapsed / BACKTRACK_MS) * RETRACT_SPEEDUP);

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 1;

      // The path behind the trail, revealed from the trail backwards as it backtracks.
      const revealedStart = Math.round(trailStart * (1 - ease(backtrack)));
      strokeRange(revealedStart, trailStart, LINE_ALPHA);

      // The trail itself, fading from its head back to its tail. As the trails close in on the middle, and then as
      // the web spreads, they settle to the web's own opacity; otherwise every trail converges bright on the centre
      // and leaves a dark band down it.
      const approach = Math.min(Math.max((head / STEPS_PER_WALKER - DIM_FROM) / (1 - DIM_FROM), 0), 1);
      const settle = Math.max(ease(approach), ease(backtrack));
      const chunk = Math.max(1, Math.ceil((head - trailStart) / TRAIL_CHUNKS));
      for (let from = trailStart; from < head; from += chunk) {
        const to = Math.min(head, from + chunk);
        const along = (to - trailStart) / Math.max(1, head - trailStart);
        const trailAlpha = TRAIL_TAIL_ALPHA + (TRAIL_HEAD_ALPHA - TRAIL_TAIL_ALPHA) * along;
        strokeRange(from, to, trailAlpha + (LINE_ALPHA - trailAlpha) * settle);
      }
      ctx.globalAlpha = 1;

      // Keep animating until the backtrack has settled.
      if (backtrack !== target) frame = requestAnimationFrame(draw);
      else lastTime = 0;
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
