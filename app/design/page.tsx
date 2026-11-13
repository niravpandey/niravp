import type { Metadata } from "next";
import katex from "katex";
import Footer from "@/components/layout/Footer";
import ColorStrip, { type Swatch } from "./ColorStrip";

export const metadata: Metadata = {
  title: "Design · Nirav Pandey",
  description: "The fonts and colors this site uses.",
};

const SERIF = "font-serif font-bold";
const SANS = "font-sans font-bold";
const MONO = "font-mono font-bold";

// The font collage: each word is placed by hand (left/top in %, size, tilt). Sizes scale with the window, capped.
const WORDS = [
  { text: "Palatino", className: SERIF, color: "var(--heading)", left: 2, top: 4, size: "clamp(2.5rem, 10vw, 5rem)", rotate: -6 },
  { text: "Verdana", className: SANS, color: "var(--accent)", left: 36, top: 36, size: "clamp(2rem, 8vw, 4.25rem)", rotate: 4 },
  { text: "Courier New", className: MONO, color: "var(--ink)", left: 4, top: 70, size: "clamp(1.75rem, 7vw, 3.75rem)", rotate: -2 },
  { text: "the quick brown fox", className: "font-mono", color: "var(--ink)", left: 1, top: 44, size: "clamp(0.8rem, 2.2vw, 1.1rem)", rotate: -3, weight: 400 },
];

// A couple of LaTeX bits in the gaps, rendered with KaTeX (its CSS is loaded in app/layout.tsx).
const MATH = [
  { tex: "\\int_0^\\infty", color: "var(--accent-2)", left: 80, top: 6, size: "clamp(1.5rem, 6vw, 3.25rem)", rotate: -6 },
  { tex: "e^{i\\pi} + 1 = 0", color: "var(--walk)", left: 70, top: 78, size: "clamp(1rem, 3.5vw, 1.9rem)", rotate: 4 },
];

// One contiguous strip, grouped by family: reds, then blues, then the rest. Names sit in white on each swatch (dark on the pale paper).
const COLORS: Swatch[] = [
  { name: "Brick", token: "--heading", hex: "#8e2f28" },
  { name: "Rust", token: "--accent-2", hex: "#a8433a" },
  { name: "Blue", token: "--accent", hex: "#2f4f8f" },
  { name: "Navy", token: "--walk", hex: "#1c2f5e" },
  { name: "Sage", token: "--line", hex: "#9cbf86" },
  { name: "Ink", token: "--ink", hex: "#222222" },
  { name: "Paper", token: "--paper", hex: "#e9eff5", dark: true },
];

export default function DesignPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center font-sans">
      <main className="flex w-full flex-1 flex-col items-center px-4 py-6 sm:px-8 sm:py-8 lg:px-16">
        <section className="w-full max-w-3xl">
          <div className="border border-line bg-letter px-4 py-3 text-sm leading-6 text-gray-700">
            These are the fonts and colors I&apos;ve used on this site. I am going for simple design choices.
          </div>

          <div className="relative mt-6 h-[13rem] overflow-hidden sm:h-[17rem]" aria-label="Fonts: Palatino, Verdana, Courier New">
            {WORDS.map((word) => (
              <span
                key={word.text}
                aria-hidden="true"
                className={`absolute whitespace-nowrap leading-none ${word.className}`}
                style={{
                  left: `${word.left}%`,
                  top: `${word.top}%`,
                  fontSize: word.size,
                  color: word.color,
                  transform: `rotate(${word.rotate}deg)`,
                  // A regular-weight sample next to the bold ones (inline, so it beats the site-wide bold mono).
                  fontWeight: "weight" in word ? word.weight : undefined,
                }}
              >
                {word.text}
              </span>
            ))}
            {MATH.map((math) => (
              <span
                key={math.tex}
                aria-hidden="true"
                className="absolute whitespace-nowrap leading-none"
                style={{
                  left: `${math.left}%`,
                  top: `${math.top}%`,
                  fontSize: math.size,
                  color: math.color,
                  transform: `rotate(${math.rotate}deg)`,
                }}
                dangerouslySetInnerHTML={{ __html: katex.renderToString(math.tex, { throwOnError: false }) }}
              />
            ))}
          </div>

          <div className="mt-6 border border-gray-200 bg-white p-4 sm:p-6">
            <ColorStrip colors={COLORS} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
