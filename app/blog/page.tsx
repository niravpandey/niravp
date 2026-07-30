import BlogIndexClient from "@/components/blog/BlogIndexClient";
import Footer from "@/components/layout/Footer";
import { getPublishedPosts } from "@/lib/blog";

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

          <BlogIndexClient posts={posts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}