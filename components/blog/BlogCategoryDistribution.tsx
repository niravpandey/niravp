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

// Keep every category in the same visual family. The small lightness stagger
// gives adjacent segments enough separation without falling back to unrelated
// colours when a site grows beyond the original palette length.
function categoryColor(index: number, categoryCount: number) {
  const progress = categoryCount <= 1 ? 0 : index / (categoryCount - 1);
  const hue = 220 + progress * 72; // blue -> mauve
  const saturation = 78 - progress * 16;
  const lightness = 48 + progress * 7 + (index % 2 === 1 ? 4 : 0);

  return `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`;
}

function ringSegmentPath(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) {
  const point = (radius: number, angle: number) => [
    50 + radius * Math.cos(angle),
    50 + radius * Math.sin(angle),
  ];
  const [outerStartX, outerStartY] = point(outerRadius, startAngle);
  const [outerEndX, outerEndY] = point(outerRadius, endAngle);
  const [innerStartX, innerStartY] = point(innerRadius, startAngle);
  const [innerEndX, innerEndY] = point(innerRadius, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerEndX} ${innerEndY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`,
    "Z",
  ].join(" ");
}

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

    const entries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

    return entries.map(([name, count], index) => ({
        name,
        count,
        percentage: Math.round((count / totalTagsCount) * 100),
        color: categoryColor(index, entries.length),
    }));
  }, [posts]);

  if (stats.length === 0) return null;

  const totalTagsCount = stats.reduce((total, stat) => total + stat.count, 0);
  const innerRadius = 29.5;
  const outerRadius = 42.5;
  const fullAngle = 2 * Math.PI;
  const gapAngle = stats.length > 1 ? Math.min(0.035, (fullAngle / stats.length) * 0.22) : 0;

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

      <div className="mt-6 flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
        {/* SVG Donut Chart */}
        <div className="relative flex w-full max-w-52 shrink-0 items-center justify-center sm:max-w-56 md:w-56">
          <svg
            viewBox="0 0 100 100"
            className="h-auto w-full overflow-visible"
            role="img"
            aria-label="Blog topics distribution"
          >
            <circle
              cx="50"
              cy="50"
              r={(innerRadius + outerRadius) / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth={outerRadius - innerRadius}
              className="text-slate-100"
              pointerEvents="none"
            />
            {stats.map((stat, index) => {
              const precedingCount = stats
                .slice(0, index)
                .reduce((total, precedingStat) => total + precedingStat.count, 0);
              const segmentAngle = (stat.count / totalTagsCount) * fullAngle;
              const startAngle = -Math.PI / 2 + (precedingCount / totalTagsCount) * fullAngle + gapAngle / 2;
              const endAngle = startAngle + Math.max(segmentAngle - gapAngle, segmentAngle * 0.35);

              const isHovered = hoveredCategory?.name === stat.name;

              return (
                stats.length === 1 ? (
                  <circle
                    key={stat.name}
                    cx="50"
                    cy="50"
                    r={(innerRadius + outerRadius) / 2}
                    fill="none"
                    stroke={stat.color}
                    strokeWidth={outerRadius - innerRadius}
                    className="cursor-pointer"
                    tabIndex={0}
                    aria-label={`${stat.name}: ${stat.count} ${stat.count === 1 ? "post" : "posts"}`}
                    onMouseEnter={() => setHoveredCategory(stat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onFocus={() => setHoveredCategory(stat)}
                    onBlur={() => setHoveredCategory(null)}
                    onClick={() => onSelectCategory(stat.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectCategory(stat.name);
                      }
                    }}
                  />
                ) : (
                  <path
                    key={stat.name}
                    d={ringSegmentPath(startAngle, endAngle, innerRadius, outerRadius)}
                    fill={stat.color}
                    stroke={stat.color}
                    strokeWidth="0.35"
                    className={`cursor-pointer transition-opacity duration-200 ease-out ${
                      hoveredCategory && !isHovered ? "opacity-45" : "opacity-100"
                    }`}
                    tabIndex={0}
                    aria-label={`${stat.name}: ${stat.count} ${stat.count === 1 ? "post" : "posts"}`}
                    onMouseEnter={() => setHoveredCategory(stat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onFocus={() => setHoveredCategory(stat)}
                    onBlur={() => setHoveredCategory(null)}
                    onClick={() => onSelectCategory(stat.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectCategory(stat.name);
                      }
                    }}
                  />
                )
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
