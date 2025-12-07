"use client";

import Link from "next/link";
import { CalendarIcon, ClockIcon, Heart } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

type BlogCardProps = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  categories: string[];
  readTime?: string;
  likes?: number;
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function BlogCard({
  title,
  slug,
  date,
  excerpt,
  categories,
  readTime,
  likes,
}: BlogCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      variants={cardVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              scale: 1.01,
              transition: { duration: 0.18 },
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.99,
              transition: { duration: 0.12 },
            }
      }
      className="w-full"
    >
      <Link
        href={`/blog/${slug}`}
        aria-label={`Read blog post: ${title}`}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-zince-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 rounded-xl"
      >
        <div
          className="
            relative w-full overflow-hidden rounded-xl
            border border-slate-400/70 bg-linear-to-br from-slate-50/90 via-slate-50/80 to-zinc-100/40
            p-5 shadow-sm
            backdrop-blur-sm
            transition-all duration-300 ease-out
            hover:border-blue-400/80 hover:shadow-lg
            dark:border-slate-800/80 dark:bg-linear-to-br dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-900/80
            dark:hover:border-slate-700
          "
        >
          {/* Subtle light sheen on hover */}
          <div
            className="
              pointer-events-none absolute inset-x-0 -top-10 h-16
              bg-linear-to-b from-white/40 via-white/10 to-transparent
              opacity-0 transition-opacity duration-300
              group-hover:opacity-100
              dark:from-white/10 dark:via-white/5
            "
          />

          <div className="relative flex h-full flex-col gap-4">
            {/* Top row: categories + meta */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Categories */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="
                        inline-flex items-center gap-1
                        rounded-full border border-zinc-100/80 bg-white/70 px-2.5 py-0.5
                        text-[0.7rem] font-semibold uppercase tracking-wide
                        text-zinc-700
                        shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                        dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200
                      "
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta compact pill */}
              <div
                className="
                  inline-flex flex-wrap items-center gap-3
                  rounded-full bg-white/60 px-3 py-1 text-xs
                  text-gray-600 shadow-sm
                  dark:bg-slate-900/80 dark:text-gray-300
                "
              >
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="whitespace-nowrap">{date}</span>
                </span>

                {readTime && (
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="whitespace-nowrap">{readTime}</span>
                  </span>
                )}

                {likes !== undefined && (
                  <span className="inline-flex items-center gap-1.5">
                    <Heart
                      className="h-3.5 w-3.5 text-rose-500 dark:text-green-400"
                      aria-hidden="true"
                    />
                    <span>{likes}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h2
              className="
                text-xl font-semibold leading-tight tracking-tight
                text-slate-900 group-hover:text-slate-950
                dark:text-slate-50 dark:group-hover:text-white
              "
            >
              {title}
            </h2>

            {/* Excerpt */}
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {excerpt}
            </p>

            {/* Footer: subtle 'Read more' affordance */}
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span
                  className="
                    h-1.5 w-1.5 rounded-full bg-emerald-500/80
                    shadow-[0_0_0_2px_rgba(16,185,129,0.35)]
                  "
                />
                <span>Open to read</span>
              </span>

              <span
                className="
                  inline-flex items-center gap-1 font-medium
                  text-blue-800 transition-colors
                  group-hover:text-blue-900
                  dark:text-green-400 dark:group-hover:text-green-300
                "
              >
                Read post
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
