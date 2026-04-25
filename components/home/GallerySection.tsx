"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "Gallery";

export default function GallerySection() {
  const [images, setImages] = useState<string[]>([]);
  const [supabase] = useState(createClient);

  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", {
        limit: 14,
        sortBy: { column: "name", order: "asc" },
      });

      if (error) {
        console.error("Failed to load gallery images:", error.message);
        return;
      }

      const urls = (data ?? [])
        .filter((file) => file.name && !file.name.endsWith("/"))
        .slice(0, 14)
        .map((file) => {
          return supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name, {
            transform: {
              width: 600,
              height: 600,
              resize: "cover",
              quality: 75,
            },
          }).data.publicUrl;
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
        {images.slice(0, 14).map((src, index) => (
          <div key={src} className="relative aspect-square overflow-hidden">
            <Image
              src={src}
              alt={`Gallery image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 200px"
            />
          </div>
        ))}
      </div>
    </section>
  );
}