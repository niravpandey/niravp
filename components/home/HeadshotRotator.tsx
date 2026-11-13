"use client";

import Image from "next/image";
import { useState } from "react";

/** Home page headshot. With several pictures, clicking it cross-fades to the next one; with one it just shows it. */
export default function HeadshotRotator({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);

  const canCycle = urls.length > 1;
  const frameClass = "relative aspect-square w-40 shrink-0 border border-line p-1 sm:w-48 md:w-56";

  const pictures = (
    <span className="relative block h-full w-full">
      {urls.map((url, i) => (
        <Image
          key={url}
          src={url}
          fill
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "auto"}
          alt={i === index ? "Nirav Pandey" : ""}
          aria-hidden={i !== index}
          sizes="(max-width: 640px) 10rem, (max-width: 768px) 12rem, 14rem"
          className={`object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </span>
  );

  if (!canCycle) return <div className={frameClass}>{pictures}</div>;

  return (
    <button
      type="button"
      onClick={() => setIndex((current) => (current + 1) % urls.length)}
      aria-label={`Show next picture (${index + 1} of ${urls.length})`}
      title="Click for another picture"
      className={`${frameClass} cursor-pointer`}
    >
      {pictures}
    </button>
  );
}
