"use server";

import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import BlogDigestManager from "@/components/admin/BlogDigestManager";

export default async function AdminBlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-8 flex items-end justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-3xl font-semibold text-mauve-500">Writing</h1>
              <p className="mt-1 text-sm text-gray-500">Drafts, published pieces, and editing access in one place.</p>
            </div>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 border border-gray-300 bg-white/50 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80"
            >
              <PhosphorIcon name="file-plus" size={16} />
              <span>New post</span>
            </Link>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-gray-400">No posts yet.</p>
          ) : (
            <BlogDigestManager posts={posts} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}