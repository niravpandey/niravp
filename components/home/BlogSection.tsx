import Image from "next/image";
import Link from "next/link";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { PostSummary } from "@/lib/blog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogSection({ posts }: { posts: PostSummary[] }) {
  const displayedPosts = (posts ?? []).slice(0, 4);

  return (
    <section className="w-full border-b border-gray-200 py-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-blue-900">
          <PhosphorIcon
            name="note-pencil"
            size={24}
            className="text-mauve-500"
          />
          My Writing
        </h1>

        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs font-medium text-mauve-500 transition-colors hover:text-blue-900"
        >
          View All
          <PhosphorIcon name="arrow-right" size={12} />
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {displayedPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group relative flex min-w-0 items-baseline gap-3 px-1 py-2 transition-colors hover:bg-gray-50/80 focus-visible:bg-gray-50/80"
          >
            <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-gray-400">
              {formatDate(post.created_at)}
            </span>

            <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-black group-hover:underline">
              {post.title}
            </h2>

            {post.description && (
              <p className="hidden min-w-0 flex-1 truncate text-xs text-gray-500">
                {post.description}
              </p>
            )}

            <div className="pointer-events-none absolute right-1 top-full z-20 mt-2 hidden w-80 translate-y-1 border border-gray-200 bg-white p-2 opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 md:flex">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden bg-gray-100">
                <Image
                  src={post.cover_image ?? "/images/blog-placeholder.jpg"}
                  alt={post.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
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
