"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { sendDigestNewsletter } from "@/app/actions/admin-digest-newsletter";
import { embedSinglePost } from "@/app/actions/embed-post";
import { compileDigestHtml } from "@/lib/newsletter-compiler";

interface Post {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  published: boolean | null;
  created_at: string | null;
  umap_x?: number | null;
  umap_y?: number | null;
  embedding?: number[] | string | null;
}

interface Props {
  posts: Post[];
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Deterministic date formatting (prevents SSR/hydration mismatch)
function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "No date";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function BlogDigestManager({ posts }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Track embedding status per post ID
  const [embeddingLoading, setEmbeddingLoading] = useState<Record<string, boolean>>({});
  const [embeddingStatus, setEmbeddingStatus] = useState<Record<string, "success" | "error" | null>>({});

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllPublished = () => {
    const publishedIds = posts.filter((p) => p.published).map((p) => p.id);
    setSelectedIds(publishedIds);
  };

  const clearSelection = () => setSelectedIds([]);

  const selectedPosts = posts.filter((p) => selectedIds.includes(p.id));

  const handleSendDigest = () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Send a digest containing ${selectedIds.length} post(s) to all verified subscribers?`
    );

    if (!confirmed) return;

    startTransition(async () => {
      const res = await sendDigestNewsletter(selectedIds);
      setStatus(res);
      if (res.success) {
        setSelectedIds([]);
      }
      setTimeout(() => setStatus(null), 6000);
    });
  };

  // Embed handler via Server Action (avoids exposed client env secrets)
  const handleEmbedPost = async (postId: string) => {
    setEmbeddingLoading((prev) => ({ ...prev, [postId]: true }));
    setEmbeddingStatus((prev) => ({ ...prev, [postId]: null }));

    try {
      const res = await embedSinglePost(postId);

      if (res.success) {
        setEmbeddingStatus((prev) => ({ ...prev, [postId]: "success" }));
      } else {
        setEmbeddingStatus((prev) => ({ ...prev, [postId]: "error" }));
      }
    } catch (err) {
      console.error("Embedding request failed:", err);
      setEmbeddingStatus((prev) => ({ ...prev, [postId]: "error" }));
    } finally {
      setEmbeddingLoading((prev) => ({ ...prev, [postId]: false }));

      // Clear status badge after 4 seconds
      setTimeout(() => {
        setEmbeddingStatus((prev) => ({ ...prev, [postId]: null }));
      }, 4000);
    }
  };

  const previewHtml = compileDigestHtml(
    selectedPosts,
    typeof window !== "undefined" ? window.location.origin : ""
  );

  return (
    <div className="relative">
      {/* Toolbar Controls */}
      <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-3">
          <button onClick={selectAllPublished} className="hover:text-gray-900 underline">
            Select all published
          </button>
          {selectedIds.length > 0 && (
            <button onClick={clearSelection} className="hover:text-gray-900 underline">
              Deselect all
            </button>
          )}
        </div>
        <span>{selectedIds.length} selected</span>
      </div>

      {/* Post List */}
      <div className="divide-y divide-gray-100 border border-gray-200 bg-white/60">
        {posts.map((post) => {
          const isSelected = selectedIds.includes(post.id);
          const isEmbedding = embeddingLoading[post.id];
          const embedState = embeddingStatus[post.id];

          return (
            <div
              key={post.id}
              className={`flex items-center justify-between px-4 py-4 transition-colors ${
                isSelected ? "bg-mauve-50/30" : "hover:bg-white/80"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  disabled={!post.published}
                  checked={isSelected}
                  onChange={() => toggleSelect(post.id)}
                  className="h-4 w-4 rounded border-gray-300 text-mauve-600 focus:ring-mauve-500 disabled:opacity-30 cursor-pointer"
                />
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="truncate font-medium text-gray-900">{post.title}</span>
                  <span className="text-xs text-gray-400">
                    /{post.slug} · {post.created_at ? formatDate(post.created_at) : "No date"}
                  </span>
                </div>
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-3">
                <span
                  className={`border px-2 py-0.5 text-xs ${
                    post.published
                      ? "border-green-300 bg-green-50 text-green-600"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>

                {/* Embed Action Button */}
                <button
                  type="button"
                  onClick={() => handleEmbedPost(post.id)}
                  disabled={isEmbedding}
                  className="inline-flex items-center gap-1 border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 transition-colors"
                  title="Generate vector embedding & update 2D PCA coordinates"
                >
                  <PhosphorIcon
                    name={(isEmbedding ? "spinner-gap" : "cpu") as any}
                    size={13}
                    className={isEmbedding ? "animate-spin text-mauve-600" : "text-gray-500"}
                  />
                  <span>{isEmbedding ? "Embedding..." : "Embed"}</span>
                </button>

                {/* Status Feedback Badges */}
                {embedState === "success" && (
                  <span className="text-xs text-emerald-600 font-medium animate-pulse">
                    ✓ Mapped
                  </span>
                )}
                {embedState === "error" && (
                  <span className="text-xs text-rose-600 font-medium">
                    Failed
                  </span>
                )}

                <Link
                  href={`/admin/blog/${post.id}`}
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                >
                  Edit
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-6 mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-lg transition-all">
          <div className="text-sm font-medium text-gray-800">
            {selectedIds.length} post{selectedIds.length > 1 ? "s" : ""} selected for digest
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              <PhosphorIcon name="eye" size={14} />
              <span>Preview Email</span>
            </button>

            <button
              onClick={handleSendDigest}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 bg-mauve-600 px-3 py-1.5 text-xs text-white hover:bg-mauve-700 disabled:opacity-50"
            >
              <PhosphorIcon name="paper-plane-tilt" size={14} />
              <span>{isPending ? "Broadcasting..." : "Send Digest"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {status && (
        <div
          className={`mt-4 rounded border p-3 text-xs ${
            status.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-gray-800 text-sm">Newsletter HTML Preview</h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <iframe
                srcDoc={previewHtml}
                className="h-full w-full rounded border border-gray-200 bg-white shadow-sm"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}