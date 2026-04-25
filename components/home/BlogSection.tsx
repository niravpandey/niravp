import Link from "next/link";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { PostSummary } from "@/lib/blog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const stickyColors = [
  "hover:bg-yellow-100 hover:shadow-[2px_2px_0px_0px_rgba(202,138,4,0.3)]",
  "hover:bg-pink-100 hover:shadow-[2px_2px_0px_0px_rgba(219,39,119,0.2)]",
  "hover:bg-blue-100 hover:shadow-[2px_2px_0px_0px_rgba(37,99,235,0.2)]",
  "hover:bg-green-100 hover:shadow-[2px_2px_0px_0px_rgba(22,163,74,0.2)]",
];

function rotationForSlug(slug: string) {
  let hash = 0;

  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }

  return ((Math.abs(hash) % 300) / 100) - 1.5;
}

export default function BlogSection({ posts }: { posts: PostSummary[] }) {
  const displayedPosts = (posts ?? []).slice(0, 4);

  return (
    <div className="w-full pt-4">
      <div className="flex items-center justify-between pb-6">
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-blue-900">
          <PhosphorIcon name="note-pencil" size={28} className="text-mauve-500" />
          My Writing
        </h1>

        <Link
          href="/blog"
          className="flex items-center gap-1 text-sm text-mauve-500 hover:text-gray-600"
        >
          View All
          <PhosphorIcon name="arrow-right" size={14} />
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-transparent">
        {displayedPosts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={
              {
                "--rotation": `${rotationForSlug(post.slug)}deg`,
              } as React.CSSProperties
            }
            className={`group py-4 px-3 -mx-3 transition-transform hover:scale-[1.01] hover:transform-[rotate(var(--rotation))_scale(1.01)] ${stickyColors[index % 4]}`}
          >
            <span className="text-xs uppercase tracking-wider text-gray-400">
              {formatDate(post.created_at)}
            </span>

            <h2 className="mt-1 font-medium text-gray-900 line-clamp-1 group-hover:font-['Caveat',cursive] group-hover:text-lg">
              {post.title}
            </h2>

            <p className="mt-1 text-sm text-gray-500 line-clamp-1">
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}