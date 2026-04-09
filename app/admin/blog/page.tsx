import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import Footer from "@/components/layout/Footer";
 
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
 
export default async function AdminBlogPage() {
  const posts = await getAllPosts();
 
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-8 flex items-end justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-3xl font-semibold text-mauve-500">Writing</h1>
              <p className="mt-1 text-sm text-gray-500">Drafts, published pieces, and editing access in one place.</p>
            </div>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-400"
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              <span>New post</span>
            </Link>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-gray-400">No posts yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 bg-white/60">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-white/80"
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="truncate font-medium text-gray-900">{post.title}</span>
                    <span className="text-xs text-gray-400">/{post.slug} · {formatDate(post.created_at)}</span>
                  </div>

                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <span
                      className={`border px-2 py-0.5 text-xs ${
                        post.published
                          ? "border-green-300 bg-green-50 text-green-600"
                          : "border-gray-300 text-gray-400"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
