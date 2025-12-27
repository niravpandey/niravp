import { Castoro } from "next/font/google";
import LikeButton from "@/components/blog/LikeButton";
import clientPromise from "@/lib/mongodb";
import Post from "./post.mdx";

const castoro = Castoro({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata = {
  title: "Eigenvectors, Everywhere",
  description:
    "Eigenvector centrality and how it connects to Google's PageRank algorithm.",
};

export default async function Page() {
  const slug = "eigenvec-centrality";

  const client = await clientPromise;
  const db = client.db("posts");
  const post = await db.collection("metadata").findOne({ slug });

  const title = post?.title ?? "Eigenvectors, Everywhere";
  const author = post?.author ?? "Nirav Pandey";

  const publishedAt = post?.publishedAt ? new Date(post.publishedAt) : undefined;
  const publishedLabel = publishedAt
    ? publishedAt.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : undefined;

  const readTime = post?.readTimeMinutes
    ? `${post.readTimeMinutes} min read`
    : undefined;

  const rawLikes = post?.likes ?? 0;
  const likes = Number(rawLikes);

  const categories = Array.isArray(post?.categories) ? post.categories : [];
  const metaItems = [publishedLabel, readTime].filter(
    (item): item is string => Boolean(item)
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main
        className="flex flex-col min-h-screen w-full max-w-6xl
                   px-4 py-4
                   sm:px-6  sm:py-6
                   md:py-12 md:px-12
                   bg-white dark:bg-zinc-950"
      >

        <article className="prose dark:prose-invert space-y-8 mx-auto w-full max-w-3xl">
          <header className="space-y-4">
            <div className="space-y-3">
              <h1 className={`text-5xl font-bold mb-2 ${castoro.className}`}>
                {title}
              </h1>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  AUTHOR
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {author}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              {metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
              <LikeButton
                slug={slug}
                initialLikes={Number.isFinite(likes) ? likes : 0}
              />
            </div>

            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-zinc-200/70 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700/70 dark:text-zinc-200"
                  >
                    {category}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {/* MDX content */}
          <Post />
        </article>
      </main>
    </div>
  );
}
