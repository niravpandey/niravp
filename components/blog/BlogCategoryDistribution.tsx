"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { cn, pluralize } from "@/lib/utils";

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
  startAngle: number;
  endAngle: number;
}

const INNER_RADIUS = 29.5;
const OUTER_RADIUS = 42.5;
const RING_RADIUS = (INNER_RADIUS + OUTER_RADIUS) / 2;
const RING_WIDTH = OUTER_RADIUS - INNER_RADIUS;
const FULL_ANGLE = 2 * Math.PI;

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

/** SVG path for one donut segment, centred in a 100x100 viewBox. */
function ringSegmentPath(startAngle: number, endAngle: number) {
  // Rounded so the server and browser produce identical strings: their trig results can differ in the last digit.
  const point = (radius: number, angle: number) =>
    `${(50 + radius * Math.cos(angle)).toFixed(3)} ${(50 + radius * Math.sin(angle)).toFixed(3)}`;
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${point(OUTER_RADIUS, startAngle)}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArc} 1 ${point(OUTER_RADIUS, endAngle)}`,
    `L ${point(INNER_RADIUS, endAngle)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${point(INNER_RADIUS, startAngle)}`,
    "Z",
  ].join(" ");
}

/** Counts tags across posts and lays them out as donut segments, largest first. */
function buildCategoryStats(posts: PostTag[]): { stats: CategoryStat[]; totalTags: number } {
  const counts = new Map<string, number>();
  for (const tag of posts.flatMap((post) => post.tags ?? [])) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const totalTags = entries.reduce((sum, [, count]) => sum + count, 0);
  const gapAngle = entries.length > 1 ? Math.min(0.035, (FULL_ANGLE / entries.length) * 0.22) : 0;

  let precedingCount = 0;
  const stats = entries.map(([name, count], index) => {
    const segmentAngle = (count / totalTags) * FULL_ANGLE;
    const startAngle = -Math.PI / 2 + (precedingCount / totalTags) * FULL_ANGLE + gapAngle / 2;
    const endAngle = startAngle + Math.max(segmentAngle - gapAngle, segmentAngle * 0.35);
    precedingCount += count;

    return {
      name,
      count,
      percentage: Math.round((count / totalTags) * 100),
      color: categoryColor(index, entries.length),
      startAngle,
      endAngle,
    };
  });

  return { stats, totalTags };
}

export default function BlogCategoryDistribution({
  posts,
  selectedCategory,
  onSelectCategory,
}: BlogCategoryDistributionProps) {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryStat | null>(null);
  const { stats, totalTags } = useMemo(() => buildCategoryStats(posts), [posts]);

  if (stats.length === 0) return null;

  const displayedCategory = hoveredCategory ?? stats.find((stat) => stat.name === selectedCategory) ?? null;

  // Shared hover / focus / click / keyboard behaviour for each chart segment.
  const segmentProps = (stat: CategoryStat) => ({
    tabIndex: 0,
    "aria-label": `${stat.name}: ${pluralize(stat.count, "post")}`,
    onMouseEnter: () => setHoveredCategory(stat),
    onMouseLeave: () => setHoveredCategory(null),
    onFocus: () => setHoveredCategory(stat),
    onBlur: () => setHoveredCategory(null),
    onClick: () => onSelectCategory(stat.name),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelectCategory(stat.name);
      }
    },
  });

  return (
    <div className="mt-8 border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Topics & Distribution</h3>
        <span className="text-xs text-gray-400">
          {totalTags} total tags across {posts.length} posts
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
        {/* Donut chart */}
        <div className="relative flex w-full max-w-52 shrink-0 items-center justify-center sm:max-w-56 md:w-56">
          <svg viewBox="0 0 100 100" className="h-auto w-full overflow-visible" role="img" aria-label="Blog topics distribution">
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={RING_WIDTH}
              className="text-slate-100"
              pointerEvents="none"
            />

            {stats.length === 1 ? (
              // A single category is a full ring; an arc path can't draw 360 degrees.
              <circle
                cx="50"
                cy="50"
                r={RING_RADIUS}
                fill="none"
                stroke={stats[0].color}
                strokeWidth={RING_WIDTH}
                className="cursor-pointer"
                {...segmentProps(stats[0])}
              />
            ) : (
              stats.map((stat) => (
                <path
                  key={stat.name}
                  d={ringSegmentPath(stat.startAngle, stat.endAngle)}
                  fill={stat.color}
                  stroke={stat.color}
                  strokeWidth="0.35"
                  className={cn(
                    "cursor-pointer transition-opacity duration-200 ease-out",
                    hoveredCategory && hoveredCategory.name !== stat.name ? "opacity-45" : "opacity-100",
                  )}
                  {...segmentProps(stat)}
                />
              ))
            )}
          </svg>

          {/* Centre label: hovered or selected category, otherwise the category count */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {displayedCategory ? (
              <>
                <span className="text-xs font-medium uppercase text-gray-400">{displayedCategory.name}</span>
                <span className="text-xl font-semibold text-gray-900">{pluralize(displayedCategory.count, "post")}</span>
                <span className="text-xs text-gray-500">{displayedCategory.percentage}%</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-blue-900">{stats.length}</span>
                <span className="text-xs lowercase text-gray-400">categories</span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-1 flex-wrap gap-2">
          {stats.map((stat) => {
            const isHovered = hoveredCategory?.name === stat.name;
            const isSelected = selectedCategory === stat.name;

            return (
              <button
                key={stat.name}
                type="button"
                onClick={() => onSelectCategory(stat.name)}
                onMouseEnter={() => setHoveredCategory(stat)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={cn(
                  "flex items-center gap-2 border px-3 py-1.5 text-xs transition-all",
                  isSelected && "border-blue-900 bg-blue-900 text-white",
                  !isSelected && isHovered && "border-gray-900 bg-gray-900 text-white",
                  !isSelected && !isHovered && "border-gray-300 bg-white text-gray-700 hover:border-gray-400",
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stat.color }} />
                <span className="font-medium">{stat.name}</span>
                <span className={cn("text-[10px]", isSelected || isHovered ? "text-gray-200" : "text-gray-400")}>
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
