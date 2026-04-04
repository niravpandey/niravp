import Link from "next/link";
import Footer from "@/components/Footer";
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
      <main className="flex flex-1 flex-col items-center bg-olive-100 px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <Link href="/" className="text-sm text-gray-500 transition-colors hover:text-gray-800">
            ← Home
          </Link>
          <div className="mt-6 mb-10 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">Writing</h1>
            <p className="mt-2 text-sm text-gray-500">Essays, notes, and whatever survives a second draft.</p>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-gray-400">No published posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="flex flex-col gap-3 border border-gray-200 bg-white/50 p-5 transition-colors hover:border-gray-400"
                >
                  <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                  <h2 className="text-xl font-medium text-gray-900">{post.title}</h2>
                  {post.description && <p className="text-sm text-gray-600">{post.description}</p>}
                  {(post.tags ?? []).length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      {(post.tags ?? []).map((tag) => (
                        <span key={tag} className="border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
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
