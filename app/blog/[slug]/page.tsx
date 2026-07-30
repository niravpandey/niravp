import type { Metadata } from "next";
import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import BlogImage from "@/components/blog/BlogImage";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { getPublishedPost } from "@/lib/blog";
import BlogCoverImage from "@/components/blog/BlogCoverImage";

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
};

const mdxComponents = {
  a: ({ className, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a
      className={["font-medium text-blue-900 underline decoration-gray-300 underline-offset-4 transition-colors hover:decoration-blue-900", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
  pre: ({ className, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className={[
        "overflow-x-auto border border-gray-200 bg-gray-950 px-4 py-3 text-sm leading-6 text-gray-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => {
    const isBlockCode = className?.includes("language-");

    return (
      <code
        className={[
          "font-mono",
          isBlockCode ? "text-gray-100" : "border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[0.9em] text-gray-900",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
  blockquote: ({ className, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={["border-l-2 border-blue-900 pl-5 text-gray-700 italic", className].filter(Boolean).join(" ")}
      {...props}
    />
  ),
  BlogImage,
  img: BlogImage,
  table: ({ className, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-8 overflow-x-auto bg-white">
      <table className={["my-0 min-w-full border-collapse text-sm", className].filter(Boolean).join(" ")} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: ComponentPropsWithoutRef<"tr">) => (
    <tr className={["even:bg-gray-50/60", className].filter(Boolean).join(" ")} {...props} />
  ),
  th: ({ className, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      className={["border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className={["border-t border-gray-100 px-4 py-3 align-top leading-6 text-gray-700", className].filter(Boolean).join(" ")} {...props} />
  ),
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
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <article className="mx-auto w-full max-w-4xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>my blog</span>
          </Link>

          <header className="mt-8 border-b border-gray-200 pb-10 text-center">
            <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-medium leading-tight text-blue-900 sm:text-5xl">{post.title}</h1>
            {post.description && <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">{post.description}</p>}
            {(post.tags ?? []).length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(post.tags ?? []).map((tag) => (
                  <span key={tag} className="border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Sharp, compact cover image header */}
            {post.cover_image && (
              <BlogCoverImage src={post.cover_image} alt={post.title} />
            )}
          </header>

          <div className="mt-10 border border-gray-200 bg-white/50 p-5 sm:p-8">
            <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24 prose-headings:font-medium prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-a:no-underline prose-p:leading-7 prose-li:leading-7 prose-code:before:content-none prose-code:after:content-none prose-pre:my-6 prose-pre:rounded-none prose-img:my-8 prose-img:rounded-none">
              <MDXRemote source={post.content ?? ""} options={mdxOptions} components={mdxComponents} />
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}