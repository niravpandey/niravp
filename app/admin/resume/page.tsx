"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "Assets";
const RESUME_PATH = "resume.pdf";
const RESUME_URL = "https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/resume.pdf";
const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

export default function AdminResumePage() {
  const [supabase] = useState(createClient);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeUpdatedAt, setResumeUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refreshResume() {
    setLoading(true);
    setError("");

    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", {
          limit: 100,
          search: RESUME_PATH,
        });

      if (listError) {
        throw new Error(listError.message);
      }

      const resume = data?.find((item) => item.name === RESUME_PATH);
      setResumeUpdatedAt(resume && "updated_at" in resume ? String(resume.updated_at ?? "") : null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to load resume status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadResume() {
      try {
        const { data, error: listError } = await supabase.storage
          .from(BUCKET_NAME)
          .list("", {
            limit: 100,
            search: RESUME_PATH,
          });

        if (listError) {
          throw new Error(listError.message);
        }

        const resume = data?.find((item) => item.name === RESUME_PATH);

        if (!cancelled) {
          setResumeUpdatedAt(resume && "updated_at" in resume ? String(resume.updated_at ?? "") : null);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load resume status.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResume();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Choose a PDF first.");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Resume must be a PDF.");
      return;
    }

    if (selectedFile.size > MAX_RESUME_SIZE_BYTES) {
      setError(`Resume must be under ${formatFileSize(MAX_RESUME_SIZE_BYTES)}.`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(RESUME_PATH, selectedFile, {
          cacheControl: "3600",
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setSelectedFile(null);
      setSuccess(`Resume uploaded (${formatFileSize(selectedFile.size)}).`);
      await refreshResume();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to upload resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-8 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">Resume</h1>
            <p className="mt-1 text-sm text-gray-500">Upload the PDF served from the Assets bucket.</p>
          </div>

          <div className="mb-8 border border-gray-200 bg-white/60 p-4 transition-colors hover:border-gray-300 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Current resume</p>
                <p className="mt-1 text-xs text-gray-500">
                  {resumeUpdatedAt ? `Last updated ${new Date(resumeUpdatedAt).toLocaleString()}` : loading ? "Checking..." : "No resume uploaded yet."}
                </p>
              </div>

              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gray-300 bg-white/50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80"
              >
                <PhosphorIcon name="file-text" size={16} />
                <span>Open resume</span>
              </a>
            </div>
          </div>

          <form onSubmit={handleUpload} className="flex flex-col gap-3 border border-gray-200 bg-white/60 p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-700">Replace resume PDF</p>

            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setError("");
                setSuccess("");
              }}
              className="border border-gray-200 bg-white/40 px-3 py-2 text-sm text-gray-900 transition-colors file:mr-3 file:border-0 file:bg-transparent file:text-sm file:text-gray-600 focus:border-gray-400 focus:outline-none"
            />

            {selectedFile && <p className="text-xs text-gray-500">{selectedFile.name} · {formatFileSize(selectedFile.size)}</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 border border-gray-300 bg-white/50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80 disabled:opacity-40"
              >
                <PhosphorIcon name="upload-simple" size={16} />
                <span>{loading ? "Working..." : "Upload PDF"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
