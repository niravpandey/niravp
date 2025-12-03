"use client";

import Link from "next/link";
import { CalendarIcon, ClockIcon, Heart } from "lucide-react";

type BlogCardProps = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  categories: string[];
  readTime?: string;
  likes?: number;
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
  return (
    <Link href={`/blog/${slug}`} passHref>
      <div className="w-full bg-blue-50 dark:bg-black cursor-pointer
                        hover:bg-blue-100 hover:dark:bg-slate-900 
                        transition-colors duration-300 ease-in-out">
        <div className="flex flex-col gap-3 p-5">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 ">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-xs font-semibold rounded-full border-2 uppercase text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 tracking-wide"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {title}
          </h2>

          {/* Meta Row */}
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{date}</span>
            </div>
            {readTime && (
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>{readTime}</span>
              </div>
            )}
            {likes !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-700 dark:text-green-500" />
                <span>{likes}</span>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <p className=" text-gray-700 dark:text-gray-300 line-clamp-3">
            {excerpt}
          </p>
        </div>
      </div>
    </Link>
  );
}
