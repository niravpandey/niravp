"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BlogCategoryDistribution from "@/components/blog/BlogCategoryDistribution";
import BlogSemanticMap from "@/components/blog/BlogSemanticMap";
import BlogTimeline from "@/components/blog/BlogTimeline";
import BlogWords from "@/components/blog/BlogWords";
import type { PostSummary } from "@/lib/blog";
import { cn, formatDate } from "@/lib/utils";

type Tab = "topics" | "map" | "timeline" | "words";

const POSTS_PER_PAGE = 5;

const TABS: { id: Tab; label: string }[] = [
  { id: "topics", label: "topics" },
  { id: "map", label: "map" },
  { id: "timeline", label: "timeline" },
  { id: "words", label: "words" },
];

type BlogIndexClientProps = {
  posts: PostSummary[];
  wordCounts: Record<string, number>;
};

export default function BlogIndexClient({ posts, wordCounts }: BlogIndexClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("topics");
  const [chartsVisible, setChartsVisible] = useState(false);
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);

  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.tags?.includes(selectedCategory))
    : posts;
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const pagePosts = filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  // Changing the filter starts again from the first page.
  function selectCategory(category: string | null) {
    setSelectedCategory(category);
    setPage(1);
  }

  // Clicking the selected category again clears the filter.
  function toggleCategory(category: string) {
    selectCategory(selectedCategory === category ? null : category);
  }

  function goToPage(next: number) {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-5">
      {/* Chart tabs, hidden until you pick one or press show */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-2 font-mono text-xs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            // Like show/hide: the open tab closes the charts; any other tab opens (or switches to) its chart.
            onClick={() => {
              setChartsVisible(!(chartsVisible && activeTab === tab.id));
              setActiveTab(tab.id);
            }}
            aria-expanded={chartsVisible && activeTab === tab.id}
            className={cn(
              "transition-colors",
              chartsVisible && activeTab === tab.id ? "text-blue-900" : "text-gray-400 hover:text-gray-700",
            )}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setChartsVisible((visible) => !visible)}
          aria-expanded={chartsVisible}
          className="ml-auto text-gray-400 transition-colors hover:text-gray-700"
        >
          {chartsVisible ? "hide" : "show"}
        </button>
      </div>

      {chartsVisible && (
        <div className="pt-4">
          {activeTab === "topics" && (
            <BlogCategoryDistribution posts={posts} selectedCategory={selectedCategory} onSelectCategory={toggleCategory} />
          )}
          {activeTab === "map" && <BlogSemanticMap posts={posts} selectedCategory={selectedCategory} />}
          {activeTab === "timeline" && <BlogTimeline posts={posts} selectedCategory={selectedCategory} />}
          {activeTab === "words" && (
            <BlogWords posts={posts} wordCounts={wordCounts} selectedCategory={selectedCategory} />
          )}
        </div>
      )}

      {/* Filter status */}
      <div ref={listTopRef} className="mt-8 flex scroll-mt-6 items-center justify-between border-b border-gray-200 pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {selectedCategory ? (
            <>
              Showing posts tagged with <span className="font-bold text-blue-900">&quot;{selectedCategory}&quot;</span>
            </>
          ) : (
            "All Articles"
          )}
        </span>

        {selectedCategory && (
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className="text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-gray-700"
          >
            Clear filter ({filteredPosts.length} of {posts.length})
          </button>
        )}
      </div>

      {/* Post list */}
      {filteredPosts.length === 0 ? (
        <p className="pt-10 text-sm text-gray-400">No published posts found for this category.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 pt-6">
            {pagePosts.map((post) => (
              <PostCard key={post.id} post={post} selectedCategory={selectedCategory} onSelectTag={toggleCategory} />
            ))}
          </div>
          {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onChange={goToPage} />}
        </>
      )}
    </div>
  );
}

type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const buttonClass =
    "px-2 py-1 text-gray-500 transition-colors hover:text-blue-900 disabled:cursor-default disabled:text-gray-300";

  return (
    <nav aria-label="Blog pages" className="mt-8 flex items-center justify-center gap-4 font-mono text-xs">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={buttonClass}
      >
        &lt;
      </button>
      <span className="text-gray-500" aria-current="page">
        page {page} of {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Next page"
        className={buttonClass}
      >
        &gt;
      </button>
    </nav>
  );
}

type PostCardProps = {
  post: PostSummary;
  selectedCategory: string | null;
  onSelectTag: (tag: string) => void;
};

function PostCard({ post, selectedCategory, onSelectTag }: PostCardProps) {
  const tags = post.tags ?? [];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex min-w-0 items-center gap-5 border border-gray-200 bg-white p-4 transition-colors hover:border-gray-400"
    >
      <div className="relative aspect-square w-32 shrink-0 overflow-hidden bg-mauve-500">
        {post.cover_image && (
          <Image src={post.cover_image} alt={post.title} fill sizes="128px" className="object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
        <h2 className="truncate text-xl font-medium text-gray-900 transition-colors group-hover:text-mauve-500">
          {post.title}
        </h2>
        {post.description && <p className="line-clamp-2 text-sm text-gray-600">{post.description}</p>}

        {tags.length > 0 && (
          <div className="mt-1 flex flex-nowrap gap-2 overflow-hidden">
            {tags.map((tag) => (
              <span
                key={tag}
                onClick={(event) => {
                  // Filter by the tag instead of following the card link.
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectTag(tag);
                }}
                className={cn(
                  "shrink-0 border px-2 py-0.5 text-xs transition-colors",
                  selectedCategory === tag
                    ? "border-blue-900 bg-blue-900 text-white"
                    : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
