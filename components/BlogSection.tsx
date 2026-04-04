import Link from "next/link";
import type { PostSummary } from "@/lib/blog";
 
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
 
export default function BlogSection({ posts }: { posts: PostSummary[] }) {
  return (
    <div className="w-full pt-4">
      <h1 className="text-3xl text-mauve-500 font-semibold pb-4">My Writing</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex flex-col gap-2 border border-gray-200 p-4 hover:border-gray-400 transition-colors"
          >
            <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
            <h2 className="font-medium text-gray-900 leading-snug">{post.title}</h2>
            <p className="text-sm text-gray-500 flex-1">{post.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(post.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="text-xs border border-gray-300 px-2 py-0.5 text-gray-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
