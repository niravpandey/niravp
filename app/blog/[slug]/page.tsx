// app/blog/[slug]/page.tsx
import clientPromise from "@/lib/mongo";
import { notFound } from "next/navigation";
import LikeSection from "@/components/blog/LikeSection";
import type { ObjectId } from "mongodb";

type BlogPost = {
  _id: ObjectId;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  categories: string[];
  readTime: string;
  content: string;
  createdAt?: Date;
};

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "blog");

  const post = await db.collection("posts").findOne<BlogPost>({ slug });
  return post;
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10">
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-sm text-zinc-500 mb-2">
          {post.date} • {post.readTime}
        </p>

        <h1>{post.title}</h1>

        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
          {post.categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-zinc-300 px-2 py-0.5 dark:border-zinc-700"
            >
              {cat}
            </span>
          ))}
        </div>

        <hr className="my-6" />

        <div className="mt-4 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      </article>

      {/* Use slug as postId for likes */}
      <LikeSection postId={post.slug} />
    </main>
  );
}
