"use client";

import Link from "next/link";
import { CalendarIcon, ClockIcon, Heart } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";

type BlogCardProps = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  categories: string[];
  readTime?: string;
  likes?: number;
};

// calmer: less travel, slightly longer, gentle ease
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1], // gentle "easeOut"
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
    <motion.div
      variants={cardVariants}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      <Link
        href={`/blog/${slug}`}
        aria-label={`Read blog post: ${title}`}
        className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 rounded-xl"
      >
        <Card
          className="
            h-full
            flex flex-col
            p-5
            rounded-none
            bg-zinc-50/80 dark:bg-zinc-950
            hover:bg-white dark:hover:bg-zinc-900
            cursor-pointer
          "
        >
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="
                        inline-flex items-center gap-1 border rounded-full
                      bg-white/80 px-2.5 py-0.5
                        text-[0.7rem] font-semibold uppercase tracking-wide
                        text-zinc-700
                        shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                        dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-200
                      ">
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="
                  border border-zinc-200/80
                  dark:border-slate-700
                  inline-flex flex-wrap items-center gap-3
                  rounded-full bg-white/80 px-3 py-1 text-xs
                  text-gray-600 shadow-sm
                  dark:bg-slate-950/80 dark:text-gray-300
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
                      className="h-3.5 w-3.5 text-gray-600 dark:text-green-400"
                      aria-hidden="true"
                    />
                    <span>{likes}</span>
                  </span>
                )}
              </div>
            </div>

            <h2
              className="
                text-xl font-semibold leading-tight tracking-tight
                text-slate-900 group-hover:text-slate-950
                dark:text-slate-50 dark:group-hover:text-white
              "
            >
              {title}
            </h2>

            <p className="line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {excerpt}
            </p>

            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                
              </span>

              <span
                className="
                  inline-flex items-center gap-1 font-medium
                  text-slate-900 transition-colors
                  group-hover:text-blue-800
                  dark:text-slate-50 dark:group-hover:text-green-400
                "
              >
                Read post
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
