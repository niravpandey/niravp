"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { PostSummary } from "@/lib/blog";
import { cn, formatDate } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

// One week column is a 10px square plus a 2px gap.
const COLUMN_WIDTH = 12;
// Calendar months shown before the earliest of the first post and today, and after the latest of the last post and today.
const PADDING_MONTHS = 3;

type BlogTimelineProps = {
  posts: PostSummary[];
  selectedCategory: string | null;
};

/** Days since 1 Jan 1970, in UTC so the server and browser agree. */
function dayNumber(iso: string) {
  return Math.floor(new Date(iso).getTime() / DAY_MS);
}

/** 0 for Monday through 6 for Sunday. 1 Jan 1970 was a Thursday. */
function weekday(day: number) {
  return (day + 3) % 7;
}

function dayDate(day: number) {
  return new Date(day * DAY_MS);
}

/** The same day of the month, a number of calendar months away (negative to go back). */
function addMonths(day: number, months: number) {
  const date = dayDate(day);
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()) / DAY_MS);
}

/** The label above a week: the year for a week holding 1 January, the month for one holding any other 1st. */
function weekLabel(weekStart: number) {
  for (let d = weekStart; d < weekStart + 7; d++) {
    const date = dayDate(d);
    if (date.getUTCDate() !== 1) continue;
    return date.getUTCMonth() === 0 ? String(date.getUTCFullYear()) : MONTHS[date.getUTCMonth()];
  }
  return null;
}

/**
 * A condensed day-by-day calendar, one column per week and one row per weekday, running from three months before
 * the first post (or today, if earlier) to three months after today (or the last post, if later). Today is green;
 * if the calendar is wider than the card, it opens scrolled so today sits two thirds of the way across.
 * Days with a post are filled blue and link to it; hovering shows the title underneath.
 * With a tag selected, posts without it are dimmed.
 */
export default function BlogTimeline({ posts, selectedCategory }: BlogTimelineProps) {
  const [hoveredId, setHoveredId] = useState<PostSummary["id"] | null>(null);
  // Read once on mount. The timeline only renders after a tab is clicked, so it's never server-rendered.
  const [today] = useState(() => dayNumber(new Date().toISOString()));
  const scrollerRef = useRef<HTMLDivElement>(null);

  const dated = useMemo(
    () => posts.filter((post) => !Number.isNaN(new Date(post.created_at).getTime())),
    [posts],
  );

  // One post per day is shown; on a day with several, the first in the list (the newest) wins.
  const postsByDay = useMemo(() => {
    const byDay = new Map<number, PostSummary>();
    for (const post of dated) {
      const day = dayNumber(post.created_at);
      if (!byDay.has(day)) byDay.set(day, post);
    }
    return byDay;
  }, [dated]);

  const days = [...postsByDay.keys()];
  const firstDay = days.length > 0 ? Math.min(...days) : 0;
  const lastDay = days.length > 0 ? Math.max(...days) : 0;
  const calendarStart = addMonths(Math.min(firstDay, today), -PADDING_MONTHS);
  const calendarEnd = addMonths(Math.max(lastDay, today), PADDING_MONTHS);
  // Whole weeks, Monday to Sunday.
  const gridStart = calendarStart - weekday(calendarStart);
  const gridEnd = calendarEnd + (6 - weekday(calendarEnd));
  const weekCount = (gridEnd - gridStart + 1) / 7;

  // If it doesn't all fit, open scrolled so today's column sits two thirds of the way across.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const todayColumn = Math.floor((today - gridStart) / 7);
    scroller.scrollLeft = todayColumn * COLUMN_WIDTH - (scroller.clientWidth * 2) / 3;
  }, [gridStart, today]);

  if (dated.length === 0) return null;

  const hovered = dated.find((post) => post.id === hoveredId);
  const spanDays = lastDay - firstDay + 1;

  return (
    <div className="border border-gray-200 bg-white p-4 font-mono text-xs text-gray-500">
      <div ref={scrollerRef} className="overflow-x-auto pb-2 [scrollbar-width:thin]">
        <div className="mx-auto w-max">
          <div className="grid auto-cols-[10px] grid-flow-col gap-0.5 pb-1 text-[10px] text-gray-400">
            {Array.from({ length: weekCount }, (_, week) => {
              const label = weekLabel(gridStart + week * 7);
              return (
                <span key={gridStart + week * 7} className="whitespace-nowrap">
                  {label}
                </span>
              );
            })}
          </div>

          <div className="grid auto-cols-[10px] grid-flow-col grid-rows-7 gap-0.5">
            {Array.from({ length: weekCount * 7 }, (_, i) => {
              const day = gridStart + i;
              const post = postsByDay.get(day);
              const cell = "block size-2.5 rounded-[1px]";
              const isToday = day === today;
              if (!post) {
                return isToday ? (
                  <span key={day} title="Today" className={cn(cell, "bg-emerald-500")} />
                ) : (
                  <span key={day} className={cn(cell, "bg-gray-100")} />
                );
              }

              const dimmed = selectedCategory !== null && !post.tags?.includes(selectedCategory);
              return (
                <Link
                  key={day}
                  href={`/blog/${post.slug}`}
                  aria-label={`${post.title}, ${formatDate(post.created_at)}`}
                  onMouseEnter={() => setHoveredId(post.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(post.id)}
                  onBlur={() => setHoveredId(null)}
                  className={cn(
                    cell,
                    "bg-blue-900 transition-[opacity,box-shadow]",
                    hoveredId === post.id && "ring-2 ring-blue-300",
                    isToday && "ring-2 ring-emerald-500",
                    dimmed && "opacity-30",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-between gap-4 text-gray-400">
        <span className="truncate">
          {hovered ? (
            <>
              <span className="text-blue-900">{hovered.title}</span> · {formatDate(hovered.created_at)}
            </>
          ) : (
            `${formatDate(dayDate(firstDay).toISOString())} – ${formatDate(dayDate(lastDay).toISOString())}`
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {dated.length} post{dated.length === 1 ? "" : "s"} across {spanDays} day{spanDays === 1 ? "" : "s"} ·
          <span className="inline-block size-2.5 rounded-[1px] bg-emerald-500" /> today
        </span>
      </div>
    </div>
  );
}
