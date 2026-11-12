"use client";

import { useEffect, useState } from "react";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import { cn } from "@/lib/utils";

// The splash stays up at least this long after the page starts loading, so it reads as a deliberate intro.
const MIN_VISIBLE_MS = 1200;
const FADE_MS = 500;

/**
 * Full-screen loading screen on the first visit. It's rendered by the server, so it covers the page before
 * anything else paints, and fades out once the page (images included) has loaded and the minimum time has
 * passed. In-site navigation after that uses app/loading.tsx instead.
 */
export default function Splash() {
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout>;
    let minTimer: ReturnType<typeof setTimeout>;

    const finish = () => {
      // performance.now() counts from the start of the page load.
      minTimer = setTimeout(() => {
        setPhase("fading");
        fadeTimer = setTimeout(() => setPhase("gone"), FADE_MS);
      }, Math.max(0, MIN_VISIBLE_MS - performance.now()));
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(minTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden={phase === "fading" || undefined}
      className={cn(
        "splash fixed inset-0 z-50 flex print:hidden items-center justify-center bg-paper transition-opacity ease-out",
        phase === "fading" && "pointer-events-none opacity-0",
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <LoadingIndicator />
    </div>
  );
}
