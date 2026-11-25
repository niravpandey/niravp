"use client";

import { useEffect, useState } from "react";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import { cn } from "@/lib/utils";

// Long enough to read as a deliberate intro, short enough not to feel like waiting.
const MIN_VISIBLE_MS = 600;
const FADE_MS = 400;
const SEEN_KEY = "splash-seen";

/**
 * Inline script for <head>: on later visits in the same browser session, marks <html> so CSS hides the
 * splash before first paint (the server can't know whether this visitor has already seen it).
 */
export const splashSeenScript = `try{if(sessionStorage.getItem("${SEEN_KEY}"))document.documentElement.dataset.splashSeen=""}catch(e){}`;

/**
 * Full-screen intro on the first page load of a browser session. It's rendered by the server, so it covers
 * the page before anything else paints, and fades out once the page is interactive and the minimum time
 * has passed. It doesn't wait for images: they load in behind it and after.
 */
export default function Splash() {
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) !== null;
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked: show the splash on each full load, as before.
    }

    let fadeTimer: ReturnType<typeof setTimeout>;
    // performance.now() counts from the start of the page load.
    const minTimer = setTimeout(
      () => {
        setPhase(seen ? "gone" : "fading");
        fadeTimer = setTimeout(() => setPhase("gone"), FADE_MS);
      },
      seen ? 0 : Math.max(0, MIN_VISIBLE_MS - performance.now()),
    );

    return () => {
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
