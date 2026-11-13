"use client";

import { useEffect, useState } from "react";

export type Swatch = { name: string; token: string; hex: string; dark?: boolean };

/** One contiguous strip of swatches. Clicking a swatch copies its hex code and briefly says so in place of the name. */
export default function ColorStrip({ colors }: { colors: Swatch[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1200);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the hex is still visible to copy by hand.
    }
  };

  return (
    <div className="grid grid-cols-7">
      {colors.map((color) => (
        <button
          key={color.token}
          type="button"
          onClick={() => copy(color.hex)}
          title={`Copy ${color.hex}`}
          aria-label={`Copy ${color.name} ${color.hex}`}
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 font-sans font-bold transition-opacity hover:opacity-90 ${color.dark ? "text-gray-700" : "text-[#ffffff]"}`}
          style={{ background: `var(${color.token})` }}
        >
          <span className="text-[0.6rem] sm:text-sm">{copied === color.hex ? "Copied" : color.name}</span>
          <span className="hidden font-mono text-[0.65rem] opacity-80 sm:block">{color.hex}</span>
        </button>
      ))}
    </div>
  );
}
