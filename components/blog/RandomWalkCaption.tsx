"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LINE_COLOR, WALKERS_PER_SIDE } from "@/components/blog/randomWalkConfig";

/**
 * Small note at the bottom of blog pages explaining the lines in the background. Hidden whenever the walks are.
 * Once you reach the bottom of the page, where the walks meet, it fades in slowly.
 * Scrolling back up fades it out.
 */
export default function RandomWalkCaption() {
  const [visible, setVisible] = useState(false);

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
    <p
      className={cn(
        "hidden pb-8 text-center font-mono text-xs transition-opacity ease-in-out md:block motion-reduce:hidden",
        visible ? "opacity-100 duration-2000" : "opacity-0 duration-700",
      )}
      style={{ color: LINE_COLOR }}
    >
      analogous to my blog, this is a random walk of moving lines meeting in the middle as you read
    </p>
  );
}
