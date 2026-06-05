import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { getPublishedPosts } from "@/lib/blog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="flex flex-1 flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex min-h-[20vh] flex-col items-center justify-center border-b border-gray-200 pb-10 text-center">
            <h1
              className="text-6xl font-medium leading-none text-blue-900 sm:text-7xl"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              NiravP
            </h1>
            <p className="mt-3 text-base lowercase text-gray-600">my blog</p>
          </div>

          {posts.length === 0 ? (
            <p className="pt-10 text-sm text-gray-400">No published posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 pt-10">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="flex h-full min-w-0 flex-col gap-3 overflow-hidden border border-gray-200 bg-white/50 p-5 transition-colors hover:border-gray-400"
                >
                  <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                  <h2 className="truncate text-xl font-medium text-gray-900">{post.title}</h2>
                  {post.description && <p className="truncate text-sm text-gray-600">{post.description}</p>}
                  {(post.tags ?? []).length > 0 && (
                    <div className="mt-auto flex flex-nowrap gap-2 overflow-hidden pt-1">
                      {(post.tags ?? []).map((tag) => (
                        <span key={tag} className="shrink-0 border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
