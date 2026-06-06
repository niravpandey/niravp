"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "Gallery";
const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|heic|jpe?g|png|webp)$/i;
const LOCATION_SEPARATOR = "--location-";

type GalleryImage = {
  path: string;
  src: string;
  location: string;
};

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

      const urls = (data ?? [])
        .filter((file) => file.name && !file.name.endsWith("/") && IMAGE_FILE_PATTERN.test(file.name))
        .slice(0, 14)
        .map((file) => {
          const src = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name, {
            transform: {
              width: 600,
              height: 600,
              resize: "cover",
              quality: 75,
            },
          }).data.publicUrl;

          return {
            path: file.name,
            src,
            location: getLocationFromPath(file.name),
          };
        });

      if (!cancelled) {
        setImages(urls);
      }
    }

    void loadImages();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {images.slice(0, 14).map((image, index) => (
          <div key={image.path} className="group relative aspect-square overflow-hidden">
            <Image
              src={image.src}
              alt={`Gallery image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 200px"
            />
            {image.location && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-3 text-center text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                📍{image.location}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
