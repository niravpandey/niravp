"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BlogCategoryDistribution from "@/components/blog/BlogCategoryDistribution";
import BlogSemanticMap from "@/components/blog/BlogSemanticMap";

export interface PostItem {
  id: string | number;
  slug: string;
  title: string;
  description?: string | null;
  created_at: string;
  cover_image?: string | null;
  tags?: string[] | null;
  embedding?: number[] | string | null; 
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function BlogIndexClient({ posts }: { posts: PostItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"distribution" | "semantic">("distribution");

  // Filter posts based on the active selection
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    return posts.filter((post) => (post.tags ?? []).includes(selectedCategory));
  }, [posts, selectedCategory]);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <div className="mt-5">
      {/* Visual Analytics Section with Tab Switcher */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("distribution")}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === "distribution"
                  ? "text-blue-900 underline underline-offset-4"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Topics Distribution
            </button>
            <span className="text-xs text-gray-300">|</span>
            <button
              onClick={() => setActiveTab("semantic")}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === "semantic"
                  ? "text-blue-900 underline underline-offset-4"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Semantic Map
            </button>
          </div>
        </div>

        <div className="pt-4">
          {activeTab === "distribution" ? (
            <BlogCategoryDistribution
              posts={posts}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          ) : (
            <BlogSemanticMap
              posts={posts}
              selectedCategory={selectedCategory}
            />
          )}
        </div>
      </div>

      {/* Filter Header / Status Bar */}
      <div className="mt-8 flex items-center justify-between border-b border-gray-200 pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {selectedCategory ? (
            <>
              Showing posts tagged with <span className="font-bold text-blue-900">"{selectedCategory}"</span>
            </>
          ) : (
            "All Articles"
          )}
        </span>

        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-gray-700"
          >
            Clear filter ({filteredPosts.length} of {posts.length})
          </button>
        )}
      </div>

      {/* Post List */}
      {filteredPosts.length === 0 ? (
        <p className="pt-10 text-sm text-gray-400">No published posts found for this category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 pt-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex min-w-0 items-center gap-5 border border-gray-200 bg-white/50 p-4 transition-colors hover:border-gray-400"
            >
              <div className="relative aspect-square w-32 shrink-0 overflow-hidden bg-mauve-500">
                <Image
                  src={post.cover_image ?? "/images/blog-placeholder.jpg"}
                  alt={post.title}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                <h2 className="truncate text-xl font-medium text-gray-900 transition-colors group-hover:text-mauve-500">
                  {post.title}
                </h2>
                {post.description && (
                  <p className="line-clamp-2 text-sm text-gray-600">{post.description}</p>
                )}
                {(post.tags ?? []).length > 0 && (
                  <div className="mt-1 flex flex-nowrap gap-2 overflow-hidden">
                    {(post.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectCategory(tag);
                        }}
                        className={`shrink-0 border px-2 py-0.5 text-xs transition-colors ${
                          selectedCategory === tag
                            ? "border-blue-900 bg-blue-900 text-white"
                            : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}