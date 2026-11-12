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
          {/* The page header, written as a dictionary entry for "blog". */}
          <header className="border-b border-line pb-8">
            <h1 className="font-serif text-4xl font-heading leading-none tracking-heading text-heading sm:text-5xl">blog</h1>
            <p className="mt-3 text-gray-600">
              <span className="font-serif italic">noun</span>
              <span className="mx-2 text-gray-400">|</span>
              <span>\ˈblȯg, ˈbläg\</span>
            </p>
            <div className="mt-4 flex max-w-2xl gap-3 text-gray-700">
              <span className="font-bold text-heading">1</span>
              <div>
                <p>
                  <em className="text-gray-500">computers</em> <strong>:</strong> a website that contains online personal
                  reflections, comments, and often hyperlinks, videos, and photographs provided by the writer
                </p>
              </div>
            </div>
          </header>

          <BlogIndexClient posts={posts} wordCounts={wordCounts} />
        </div>
      </main>
      <RandomWalkCaption />
      <Footer />
    </div>
  );
}