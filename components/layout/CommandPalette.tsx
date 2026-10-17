"use client";

import { Fragment, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { SearchablePost } from "@/lib/blog";
import { fuzzyScore } from "@/lib/fuzzy";
import { formatDate } from "@/lib/utils";

const MAX_RESULTS = 8;
// Drop results scoring far below the best one, so stray letter matches don't pad the list.
const MIN_RELATIVE_SCORE = 0.25;

type Result = { post: SearchablePost; indices: number[] };

const noSubscribe = () => () => {};
/** Mac shows ⌘K, everything else Ctrl K. Assumes Mac during server render. */
function useIsMac() {
  return useSyncExternalStore(
    noSubscribe,
    () => /mac|iphone|ipad/i.test(navigator.userAgent),
    () => true,
  );
}

/** Title with the matched letters emphasised. */
function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  const matched = new Set(indices);
  return (
    <>
      {[...text].map((char, index) =>
        matched.has(index) ? (
          <mark key={index} className="bg-transparent font-semibold text-blue-900">
            {char}
          </mark>
        ) : (
          <Fragment key={index}>{char}</Fragment>
        ),
      )}
    </>
  );
}

function search(posts: SearchablePost[], query: string): Result[] {
  if (!query.trim()) return posts.slice(0, MAX_RESULTS).map((post) => ({ post, indices: [] }));

  const scored = posts.flatMap((post) => {
    const match = fuzzyScore(query, [
      { text: post.title, weight: 3 },
      { text: (post.tags ?? []).join(" "), weight: 2 },
      { text: post.description ?? "", weight: 1 },
    ]);
    return match ? [{ post, indices: match.indices, score: match.score }] : [];
  });

  const best = Math.max(0, ...scored.map((result) => result.score));
  return scored
    .filter((result) => result.score >= best * MIN_RELATIVE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
}

/** Spotlight-style blog search: Cmd/Ctrl+K or "/" anywhere, or the navbar button. */
export default function CommandPalette({ posts }: { posts: SearchablePost[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isMac = useIsMac();

  const results = useMemo(() => search(posts, query), [posts, query]);

  // Every way of opening starts from a fresh, empty search.
  function openPalette() {
    setQuery("");
    setSelectedIndex(0);
    setOpen(true);
  }

  // Global shortcuts.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.closest("input, textarea, select, [contenteditable='true']");

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setSelectedIndex(0);
        setOpen((current) => !current);
      } else if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setQuery("");
        setSelectedIndex(0);
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Stop the page scrolling behind the dialog.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function go(result: Result | undefined) {
    if (!result) return;
    setOpen(false);
    router.push(`/blog/${result.post.slug}`);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[selectedIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search posts"
        className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
      >
        Search
        <kbd className="hidden rounded border border-white/30 px-1 font-sans text-[10px] leading-4 opacity-80 sm:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-blue-950/30 px-4 pt-[15vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search posts"
            className="w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 px-4">
              {/* Thin outline magnifier (the icon font only has filled glyphs). */}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search posts…"
                role="combobox"
                aria-expanded="true"
                aria-controls="search-results"
                aria-activedescendant={results[selectedIndex] ? `search-result-${selectedIndex}` : undefined}
                className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
              />
              <kbd className="rounded border border-gray-200 px-1.5 py-0.5 font-sans text-[11px] text-gray-400">esc</kbd>
            </div>

            <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-gray-500">No posts match “{query}”.</li>
              )}
              {results.map((result, index) => (
                <li
                  key={result.post.slug}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onMouseMove={() => setSelectedIndex(index)}
                  onClick={() => go(result)}
                  className={`cursor-pointer rounded-lg px-3 py-2 ${index === selectedIndex ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm text-gray-900">
                      <Highlighted text={result.post.title} indices={result.indices} />
                    </p>
                    <span className="shrink-0 text-xs text-gray-400 uppercase">
                      {formatDate(result.post.created_at)}
                    </span>
                  </div>
                  {result.post.description && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">{result.post.description}</p>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex gap-4 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
              <span>↑↓ to move</span>
              <span>↵ to open</span>
              <span>esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
