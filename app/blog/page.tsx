import { getTopPosts } from "@/lib/posts";
import BlogCard from "@/components/blog/BlogCard";
import Section from "@/components/Section";

export default async function BlogIndexPage() {
  // Top 4 posts with likes
  const posts = await getTopPosts(4);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main
        className="
          flex flex-col min-h-screen w-full max-w-6xl 
          px-4 py-4
          sm:px-6 sm:py-6
          md:py-12 md:px-12 
          bg-white dark:bg-zinc-950
        "
      >
        <Section className="bg-dotgrid">
          <div className="flex flex-col gap-3">
            <h1 className="text-5xl font-bold">Blog</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Latest posts, fetched from MongoDB.
            </p>
          </div>

          <div className="flex flex-col py-6 gap-2">
            {posts.map((post: any) => (
              <BlogCard
                key={post.slug}
                title={post.title}
                slug={post.slug}
                date={post.date}
                excerpt={post.excerpt}
                categories={post.categories}
                readTime={post.readTime}
                likes={post.likes ?? 0}
              />
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
