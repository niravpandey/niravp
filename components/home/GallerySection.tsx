"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "Gallery";
const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|heic|jpe?g|png|webp)$/i;
const LOCATION_SEPARATOR = "--location-";
const MAX_IMAGES = 14;
// Widest screen the strip should fill without a gap, and the largest tile width (h-28 + gap).
const MIN_STRIP_WIDTH = 2560;
const TILE_WIDTH = 120;
const THUMBNAIL_TRANSFORM = { width: 600, height: 600, resize: "cover", quality: 75 } as const;

type GalleryImage = {
  path: string;
  src: string;
  location: string;
};

/** "beach--location-bondi-sydney.jpg" -> "bondi sydney" */
function getLocationFromPath(path: string) {
  const nameWithoutExtension = path.replace(/\.[^/.]+$/, "");
  const locationSlug = nameWithoutExtension.split(LOCATION_SEPARATOR)[1];

  return locationSlug?.replace(/-/g, " ") ?? "";
}

export default function GallerySection() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [supabase] = useState(createClient);

  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

      if (error) {
        console.error("Failed to load gallery images:", error.message);
        return;
      }

      const gallery = (data ?? [])
        .filter((file) => IMAGE_FILE_PATTERN.test(file.name))
        .slice(0, MAX_IMAGES)
        .map((file) => ({
          path: file.name,
          src: supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name, { transform: THUMBNAIL_TRANSFORM }).data
            .publicUrl,
          location: getLocationFromPath(file.name),
        }));

      if (!cancelled) setImages(gallery);
    }

    void loadImages();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Repeat the photos until one run is wider than the screen, then render that run twice and
  // slide left by half the total width, so the loop is seamless.
  const repeats = Math.max(1, Math.ceil(MIN_STRIP_WIDTH / (Math.max(images.length, 1) * TILE_WIDTH)));
  const run = Array.from({ length: repeats }, () => images).flat();
  const loop = [...run, ...run];

  return (
    <section
      aria-label="Gallery"
      className="relative h-24 w-full overflow-hidden mask-x-from-90% sm:h-28"
    >
      {images.length > 0 && (
        <div
          className="gallery-marquee flex h-full w-max"
          style={{ animationDuration: `${run.length * 6}s` }}
        >
          {loop.map((image, index) => {
            const isCopy = index >= images.length;
            return (
              <div key={`${image.path}-${index}`} className="h-full shrink-0 pr-2" aria-hidden={isCopy || undefined}>
                <div className="group relative aspect-square h-full overflow-hidden">
                  <Image
                    src={image.src}
                    alt={isCopy ? "" : image.location ? `Photo from ${image.location}` : `Gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                  {image.location && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-3 text-center text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      📍{image.location}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
