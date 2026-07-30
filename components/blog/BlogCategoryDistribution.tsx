"use client";

import { useMemo, useState } from "react";

interface PostTag {
  tags?: string[] | null;
}

interface BlogCategoryDistributionProps {
  posts: PostTag[];
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
}

interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const COLOR_PALETTE = [
  "#1e3a8a", // blue-900
  "#3b82f6", // blue-500
  "#8b5cf6", // purple-500
  "#d946ef", // fuchsia-500
  "#64748b", // slate-500
  "#0f766e", // teal-700
  "#b45309", // amber-700
  "#475569", // slate-600
];

export default function BlogCategoryDistribution({
  posts,
  selectedCategory,
  onSelectCategory,
}: BlogCategoryDistributionProps) {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryStat | null>(null);

  // Extract tags and calculate statistics
  const stats = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    let totalTagsCount = 0;

    posts.forEach((post) => {
      (post.tags ?? []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        totalTagsCount += 1;
      });
    });

    if (totalTagsCount === 0) return [];

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name,
        count,
        percentage: Math.round((count / totalTagsCount) * 100),
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      }));
  }, [posts]);

  if (stats.length === 0) return null;

  let cumulativePercent = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const activeDisplayCategory =
    hoveredCategory ?? stats.find((s) => s.name === selectedCategory) ?? null;

  return (
    <div className="mt-8 border border-gray-200 bg-white/50 p-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Topics & Distribution
        </h3>
        <span className="text-xs text-gray-400">
          {stats.reduce((acc, curr) => acc + curr.count, 0)} total tags across {posts.length} posts
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-8 md:flex-row">
        {/* SVG Donut Chart */}
        <div className="relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-44 w-44 -rotate-90 transform overflow-visible">
            {stats.map((stat) => {
              const strokeDasharray = `${(stat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += stat.percentage;

              const isHovered = hoveredCategory?.name === stat.name;
              const isSelected = selectedCategory === stat.name;

              return (
                <circle
                  key={stat.name}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={stat.color}
                  strokeWidth={isHovered || isSelected ? "14" : "10"}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer transition-all duration-200 ease-out"
                  onMouseEnter={() => setHoveredCategory(stat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onSelectCategory(stat.name)}
                />
              );
            })}
          </svg>

          {/* Center Info on Hover / Selection */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {activeDisplayCategory ? (
              <>
                <span className="text-xs font-medium uppercase text-gray-400">
                  {activeDisplayCategory.name}
                </span>
                <span className="text-xl font-semibold text-gray-900">
                  {activeDisplayCategory.count} {activeDisplayCategory.count === 1 ? "post" : "posts"}
                </span>
                <span className="text-xs text-gray-500">{activeDisplayCategory.percentage}%</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-blue-900">{stats.length}</span>
                <span className="text-xs text-gray-400 lowercase">categories</span>
              </>
            )}
          </div>
        </div>

        {/* Category Legend Grid */}
        <div className="flex flex-1 flex-wrap gap-2">
          {stats.map((stat) => {
            const isHovered = hoveredCategory?.name === stat.name;
            const isSelected = selectedCategory === stat.name;

            return (
              <button
                key={stat.name}
                onClick={() => onSelectCategory(stat.name)}
                onMouseEnter={() => setHoveredCategory(stat)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center gap-2 border px-3 py-1.5 text-xs transition-all ${
                  isSelected
                    ? "border-blue-900 bg-blue-900 text-white"
                    : isHovered
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="font-medium">{stat.name}</span>
                <span
                  className={`text-[10px] ${
                    isSelected || isHovered ? "text-gray-200" : "text-gray-400"
                  }`}
                >
                  ({stat.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}