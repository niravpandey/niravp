"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";

type GalleryItem = {
  name: string;
  path: string;
  publicUrl: string;
  created_at?: string;
};

const BUCKET_NAME = "Gallery";

async function listImages(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list("", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(item.name);

      return {
        name: item.name,
        path: item.name,
        publicUrl: urlData.publicUrl,
        created_at: "created_at" in item ? String(item.created_at ?? "") : "",
      };
    }) as GalleryItem[];
}

export default function AdminGalleryPage() {
  const [supabase] = useState(createClient);
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refreshImages() {
    try {
      setImages(await listImages(supabase));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to load gallery images.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialImages() {
      try {
        const data = await listImages(supabase);
        if (!cancelled) {
          setImages(data);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load gallery images.");
        }
      }
    }

    void loadInitialImages();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Please choose at least one image.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      for (const file of Array.from(selectedFiles)) {
        const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const safeBaseName = baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const fileName = `${Date.now()}-${safeBaseName || "image"}${fileExt ? `.${fileExt}` : ""}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }
      }

      setSelectedFiles(null);
      setSuccess("Image upload complete.");
      await refreshImages();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(path: string) {
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    setSuccess("Image deleted.");
    setLoading(false);
    await refreshImages();
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <PhosphorIcon name="arrow-left" size={16} />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-8 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">Gallery</h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload and manage images in the Supabase bucket called {BUCKET_NAME}.
            </p>
          </div>

          <form
            onSubmit={handleUpload}
            className="mb-10 flex flex-col gap-3 border border-gray-200 bg-white/60 p-4 sm:p-5"
          >
            <p className="text-sm font-medium text-gray-700">Upload images</p>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                setSelectedFiles(event.target.files);
                setError("");
                setSuccess("");
              }}
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:text-gray-600"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-40"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-3">
            {images.length === 0 ? (
              <div className="border border-gray-200 bg-white/60 p-4 text-sm text-gray-500">
                No gallery images yet.
              </div>
            ) : (
              images.map((image) => (
                <div
                  key={image.path}
                  className="border border-gray-200 bg-white/60 p-4 transition-colors hover:border-gray-300"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden border border-gray-200 bg-gray-100">
                        {/* plain img keeps this page simple */}
                        <img
                          src={image.publicUrl}
                          alt={image.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {image.name}
                        </p>
                        <a
                          href={image.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
                        >
                          <span className="truncate">Open image</span>
                          <PhosphorIcon name="arrow-square-out" size={14} />
                        </a>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(image.path)}
                        className="text-xs text-gray-400 transition-colors hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}