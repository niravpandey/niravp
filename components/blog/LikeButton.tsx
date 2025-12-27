"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

type LikeButtonProps = {
  slug: string;
  initialLikes: number;
};

export default function LikeButton({ slug, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const storageKey = `blog-like:${slug}`;

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    setHasLiked(stored === "1");
  }, [storageKey]);

  const handleLike = async () => {
    if (isLiking) {
      return;
    }

    const nextHasLiked = !hasLiked;
    const delta = nextHasLiked ? 1 : -1;
    const nextLikes = Math.max(likes + delta, 0);

    setHasLiked(nextHasLiked);
    setLikes(nextLikes);
    setIsBouncing(true);
    setIsPulsing(true);
    window.setTimeout(() => setIsBouncing(false), 350);
    window.setTimeout(() => setIsPulsing(false), 300);

    setIsLiking(true);
    try {
      if (typeof window !== "undefined") {
        if (nextHasLiked) {
          window.localStorage.setItem(storageKey, "1");
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }

      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: nextHasLiked ? "like" : "unlike" }),
      });

      if (!response.ok) {
        setHasLiked((prev) => !prev);
        setLikes((prev) => Math.max(prev - delta, 0));
        if (typeof window !== "undefined") {
          if (!nextHasLiked) {
            window.localStorage.setItem(storageKey, "1");
          } else {
            window.localStorage.removeItem(storageKey);
          }
        }
        return;
      }

      const data: { likes?: number | string } = await response.json();
      if (data.likes !== undefined) {
        const nextLikes = Number(data.likes);
        if (Number.isFinite(nextLikes)) {
          setLikes(nextLikes);
        }
      }
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleLike}
        disabled={isLiking}
        className={`inline-flex items-center gap-2 rounded-full text-xs font-medium transition duration-200 ${
          hasLiked
            ? "text-blue-800 dark:text-green-400"
            : "text-blue-800/60 hover:text-blue-800 dark:text-green-400/60 dark:hover:text-green-400"
        } ${isBouncing ? "scale-[1.03]" : ""} ${isLiking ? "opacity-60" : ""}`}
        aria-pressed={hasLiked}
      >
        <Heart
          className={`h-3.5 w-3.5 transition ${
            hasLiked ? "fill-current" : ""
          } ${isBouncing ? "scale-110" : ""}`}
        />
        <span className="tabular-nums">{likes}</span>
      </button>
      <span
        className={`text-[11px] text-zinc-500 transition dark:text-zinc-400 ${
          isPulsing ? "scale-105 text-blue-800 dark:text-green-400" : ""
        }`}
        aria-live="polite"
      >
        likes
      </span>
    </div>
  );
}
