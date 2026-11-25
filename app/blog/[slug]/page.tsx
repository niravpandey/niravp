import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import { mdxComponents, mdxOptions } from "@/components/blog/mdxComponents";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { getPublishedPost, getPublishedPosts } from "@/lib/blog";
import { getAuthorProfile } from "@/lib/site-settings";
import { formatDate } from "@/lib/utils";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

/** Prerender every published post at build; posts published later render on first visit, then stay cached. */
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublishedPost(slug);

  if (!post) {
    return { title: "Post not found | Nirav Pandey" };
  }

  return {
    title: `${post.title} | Nirav Pandey`,
    description: post.description ?? "Writing by Nirav Pandey",
  };
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const { slug } = await props.params;
  const post = await getPublishedPost(slug);

  if (!post) notFound();

  const authorProfile = await getAuthorProfile();

  return (
    <div className="flex flex-1 flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-8 sm:py-24 lg:px-16">
        <article className="mx-auto w-full max-w-4xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>my blog</span>
          </Link>

          <header className="mt-6 border-b border-line pb-8 text-center sm:mt-8 sm:pb-10">
            <p className="text-xs text-gray-400">{formatDate(post.created_at, "long")}</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-3xl font-heading tracking-heading leading-tight text-heading sm:text-5xl">{post.title}</h1>
            {post.description && <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">{post.description}</p>}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="border border-line px-2 py-0.5 text-xs text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {post.cover_image && <BlogCoverImage src={post.cover_image} alt={post.title} />}
          </header>

          <div className="mt-8 border border-line bg-white p-4 sm:mt-10 sm:p-8">
            <div className="prose prose-gray max-w-none break-words prose-headings:scroll-mt-24 prose-headings:font-medium prose-headings:text-gray-900 prose-h1:text-3xl sm:prose-h1:text-4xl prose-h2:border-b prose-h2:border-line prose-h2:pb-2 prose-a:no-underline prose-p:leading-7 prose-li:leading-7 prose-code:before:content-none prose-code:after:content-none prose-pre:my-6 prose-pre:rounded-none prose-pre:bg-transparent prose-img:my-8 prose-img:rounded-none">
              <MDXRemote source={post.content ?? ""} options={mdxOptions} components={mdxComponents} />
            </div>
          </div>

          <aside className="mt-8 flex items-start gap-4 sm:items-center border border-line bg-white p-4 sm:p-5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-gray-100">
              <Image
                src={authorProfile.headshotUrl}
                alt="Nirav Pandey"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <p className="text-sm leading-6 text-gray-600">{authorProfile.bio}</p>
          </aside>
        </article>
      </main>
      <Footer />
    </div>
  );
}
