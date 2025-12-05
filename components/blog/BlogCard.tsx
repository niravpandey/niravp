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
      // cubic-bezier equivalent to a nice easeOut-ish curve
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
        className="block"
      >
        <div
          className="w-full cursor-pointer  border border-blue-100/60 
                     bg-blue-50/70 p-5 shadow-sm backdrop-blur-sm
                     transition-all duration-300 ease-out
                     hover:border-blue-200 hover:bg-blue-100
                     dark:border-slate-800 dark:bg-black/60 dark:hover:bg-slate-900"
        >
          <div className="flex flex-col gap-3">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border-2 border-gray-200 bg-gray-100 px-2 py-0.5 
                               text-xs font-semibold uppercase tracking-wide
                               text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
              {title}
            </h2>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                <span>{date}</span>
              </div>

              {readTime && (
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{readTime}</span>
                </div>
              )}

              {likes !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Heart
                    className="h-4 w-4 text-red-700 dark:text-green-500"
                    aria-hidden="true"
                  />
                  <span>{likes}</span>
                </div>
              )}
            </div>

            {/* Excerpt */}
            <p className="line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
              {excerpt}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
