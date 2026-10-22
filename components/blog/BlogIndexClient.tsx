"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BlogCategoryDistribution from "@/components/blog/BlogCategoryDistribution";
import BlogSemanticMap from "@/components/blog/BlogSemanticMap";
import type { PostSummary } from "@/lib/blog";
import { cn, formatDate } from "@/lib/utils";

type Tab = "distribution" | "semantic";

const TABS: { id: Tab; label: string }[] = [
  { id: "distribution", label: "Topics Distribution" },
  { id: "semantic", label: "Semantic Map" },
];

export default function BlogIndexClient({ posts }: { posts: PostSummary[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("distribution");

  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.tags?.includes(selectedCategory))
    : posts;

  // Clicking the selected category again clears the filter.
  function toggleCategory(category: string) {
    setSelectedCategory((current) => (current === category ? null : category));
  }

  return (
    <div className="mt-5">
      {/* Chart tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {TABS.map((tab, index) => (
          <span key={tab.id} className="flex gap-2">
            {index > 0 && <span className="text-xs text-gray-300">|</span>}
            <button
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-xs font-semibold uppercase tracking-wider transition-colors",
                activeTab === tab.id ? "text-blue-900 underline underline-offset-4" : "text-gray-400 hover:text-gray-700",
              )}
            >
              {tab.label}
            </button>
          </span>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === "distribution" ? (
          <BlogCategoryDistribution posts={posts} selectedCategory={selectedCategory} onSelectCategory={toggleCategory} />
        ) : (
          <BlogSemanticMap posts={posts} selectedCategory={selectedCategory} />
        )}
      </div>

      {/* Filter status */}
      <div className="mt-8 flex items-center justify-between border-b border-gray-200 pb-3">
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
            onClick={() => setSelectedCategory(null)}
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
        <div className="grid grid-cols-1 gap-4 pt-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} selectedCategory={selectedCategory} onSelectTag={toggleCategory} />
          ))}
        </div>
      )}
    </div>
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
