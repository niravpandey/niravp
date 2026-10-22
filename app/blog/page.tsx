import BlogIndexClient from "@/components/blog/BlogIndexClient";
import RandomWalkCaption from "@/components/blog/RandomWalkCaption";
import Footer from "@/components/layout/Footer";
import { getPublishedPosts, getPublishedWordCounts } from "@/lib/blog";

export default async function BlogIndexPage() {
  const [posts, wordCounts] = await Promise.all([getPublishedPosts(), getPublishedWordCounts()]);

  return (
    <div className="flex flex-1 flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex min-h-[20vh] flex-col items-center justify-center border-b border-gray-200 pb-10 text-center">
            <h1
              className="relative isolate text-6xl font-medium leading-none text-blue-900 sm:text-7xl"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              {/* Soft violet glow behind the name, in the random walks' hue. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-6 inset-y-1 -z-10 rounded-full blur-2xl"
                style={{ backgroundColor: "oklch(78% 0.09 300 / 0.35)" }}
              />
              NiravP
            </h1>
            <p className="mt-3 text-base lowercase text-gray-600">my blog</p>
          </div>

          <BlogIndexClient posts={posts} wordCounts={wordCounts} />
        </div>
      </main>
      <RandomWalkCaption />
      <Footer />
    </div>
  );
}