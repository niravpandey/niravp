"use client";

import { useEffect, useState } from "react";

type Props = {
  postId: string; // we'll pass the slug
};

export default function LikeSection({ postId }: Props) {
  const [likes, setLikes] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "liked" | "already">("idle");

  // Fetch current like count
  useEffect(() => {
    async function fetchLikes() {
      try {
        const res = await fetch(`/api/like?postId=${encodeURIComponent(postId)}`);
        const data = await res.json();
        setLikes(data.likes ?? 0);
      } catch (err) {
        console.error("Error fetching likes:", err);
      }
    }

    fetchLikes();
  }, [postId]);

  async function handleLike() {
    if (status === "loading" || status === "liked" || status === "already") return;

    setStatus("loading");

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.status === 409) {
        // already liked according to API
        setStatus("already");
        return;
      }

      const data = await res.json();
      if (data.ok) {
        setStatus("liked");
        setLikes((prev) => (prev == null ? 1 : prev + 1));
      } else {
        setStatus("idle");
      }
    } catch (err) {
      console.error("Error liking post:", err);
      setStatus("idle");
    }
  }

  const disabled = status === "loading" || status === "liked" || status === "already";

  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        onClick={handleLike}
        disabled={disabled}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "idle" && "Like"}
        {status === "loading" && "Liking…"}
        {status === "liked" && "Liked ❤️"}
        {status === "already" && "Already liked"}
      </button>

      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {likes === null ? "Loading likes…" : `${likes} like${likes === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}
