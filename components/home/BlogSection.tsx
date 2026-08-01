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
    <section className="w-full pt-2">
      <div className="flex items-center justify-between pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-blue-900">
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
            className="group block py-2.5 px-1 transition-colors hover:bg-gray-50/80"
          >
            <div className="flex items-center gap-4">
              <div className="relative aspect-10/10 w-32 shrink-0 overflow-hidden bg-gray-100">
                <div className="relative aspect-10/10 w-32 shrink-0">
                  <Image
                    src={post.cover_image ?? "/images/blog-placeholder.jpg"}
                    alt={post.title}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-center">
                <span className="text-[11px] uppercase tracking-wider text-gray-400">
                  {formatDate(post.created_at)}
                </span>

                <h2 className="mt-0.5 line-clamp-1 text-base text-gray-900 transition-colors group-hover:text-black group-hover:underline">
                  {post.title}
                </h2>

                <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                  {post.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}