import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import Footer from "@/components/Footer";
import { getPublishedPost } from "@/lib/blog";

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublishedPost(slug);

  if (!post) {
    return {
      title: "Post not found | Nirav Pandey",
    };
  }

  return {
    title: `${post.title} | Nirav Pandey`,
    description: post.description ?? "Writing by Nirav Pandey",
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPublishedPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col font-sans">
      <main className="flex flex-1 flex-col items-center bg-olive-100 px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <article className="mx-auto w-full max-w-3xl">
          <Link href="/blog" className="text-sm text-gray-500 transition-colors hover:text-gray-800">
            ← All writing
          </Link>

          <header className="mt-6 border-b border-gray-200 pb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{formatDate(post.created_at)}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-mauve-500">{post.title}</h1>
            {post.description && <p className="mt-4 max-w-2xl text-base text-gray-600">{post.description}</p>}
            {(post.tags ?? []).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {(post.tags ?? []).map((tag) => (
                  <span key={tag} className="border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-gray prose-headings:font-semibold prose-a:text-mauve-500 mt-10 max-w-none border border-gray-200 bg-white/50 p-6 sm:p-8">
            <MDXRemote source={post.content ?? ""} options={mdxOptions} />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
