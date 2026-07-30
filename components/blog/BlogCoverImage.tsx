"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface BlogCoverImageProps {
  src: string;
  alt: string;
}

export default function BlogCoverImage({ src, alt }: BlogCoverImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start revealing when the top enters viewport (90% from top)
      // Fully revealed by the time it reaches upper screen (30% from top)
      const start = windowHeight * 0.9;
      const end = windowHeight * 0.3;

      const current = rect.top;
      const progress = Math.min(Math.max((start - current) / (start - end), 0), 1);

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="group relative mt-8 aspect-21/9 w-full overflow-hidden border border-gray-200 bg-mauve-500"
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="(max-width: 896px) 100vw, 896px"
        style={
          mounted
            ? {
                filter: `grayscale(${100 - scrollProgress * 100}%) contrast(${
                  2000 - scrollProgress * 1900
                }%)`,
                opacity: 0.1 + scrollProgress * 0.9,
              }
            : undefined
        }
        className={`object-cover transition-all duration-150 ease-out group-hover:filter-none! group-hover:opacity-100! ${
          !mounted ? "grayscale opacity-10 contrast-2000" : ""
        }`}
      />
    </div>
  );
}