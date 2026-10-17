import Image from "next/image";
import Link from "next/link";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import SectionHeading from "@/components/ui/SectionHeading";
import type { PostSummary } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export default function BlogSection({ posts }: { posts: PostSummary[] }) {
  return (
    <section className="w-full border-b border-gray-200 py-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <SectionHeading icon="note-pencil" iconSize={24}>
          My Writing
        </SectionHeading>

        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs font-medium text-mauve-500 transition-colors hover:text-blue-900"
        >
          View All
          <PhosphorIcon name="arrow-right" size={12} />
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group relative flex min-w-0 items-baseline gap-3 px-1 py-2 transition-colors hover:bg-gray-50/80 focus-visible:bg-gray-50/80"
          >
            <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-gray-400">
              {formatDate(post.created_at)}
            </span>

            <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-black group-hover:underline">
              {post.title}
            </h3>

            {/* Hover preview card (desktop only) */}
            <div className="pointer-events-none absolute right-1 top-full z-20 mt-2 hidden w-80 translate-y-1 border border-gray-200 bg-white p-2 opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 md:flex">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden bg-gray-100">
                {post.cover_image && (
                  <Image src={post.cover_image} alt={post.title} fill sizes="80px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 px-2 py-0.5">
                <p className="truncate text-sm font-medium text-gray-900">
                  {post.title}
                </p>
                {post.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    {post.description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
