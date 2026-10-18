"use client";

import { MDXRemote } from "next-mdx-remote";
import BlogImage from "@/components/blog/BlogImage";
import type { PreviewSource } from "./editorUtils";

const previewMdxComponents = {
  BlogImage,
  img: BlogImage,
  a: ({ className, ...props }: React.ComponentPropsWithoutRef<"a">) => (
    <a
      className={["font-medium text-blue-900 underline decoration-gray-300 underline-offset-4", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
  pre: ({ className, ...props }: React.ComponentPropsWithoutRef<"pre">) => (
    <pre
      className={[
        "overflow-x-auto bg-transparent px-0 py-3 font-mono text-[0.85rem] leading-7 text-gray-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.ComponentPropsWithoutRef<"code">) => {
    const isBlockCode = className?.includes("language-");

    return (
      <code
        className={[
          "font-mono text-[0.9em] tracking-[-0.01em]",
          isBlockCode ? "text-gray-700" : "text-mauve-700",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
  blockquote: ({ className, ...props }: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={["border-l-2 border-blue-900 pl-5 text-gray-700 italic", className].filter(Boolean).join(" ")}
      {...props}
    />
  ),
  table: ({ className, ...props }: React.ComponentPropsWithoutRef<"table">) => (
    <div className="my-8 overflow-x-auto bg-white">
      <table className={["my-0 min-w-full border-collapse text-sm", className].filter(Boolean).join(" ")} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: React.ComponentPropsWithoutRef<"tr">) => (
    <tr className={["even:bg-gray-50/60", className].filter(Boolean).join(" ")} {...props} />
  ),
  th: ({ className, ...props }: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className={["border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.ComponentPropsWithoutRef<"td">) => (
    <td className={["border-t border-gray-100 px-4 py-3 align-top leading-6 text-gray-700", className].filter(Boolean).join(" ")} {...props} />
  ),
};

function formatPreviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type BlogPreviewProps = {
  compiledSource: PreviewSource | null;
  description: string;
  error: string | null;
  loading: boolean;
  title: string;
  tags: string;
  createdAt: string;
};

export default function BlogPreview({
  compiledSource,
  description,
  error,
  loading,
  title,
  tags,
  createdAt,
}: BlogPreviewProps) {
  const normalizedTags = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <aside className="flex h-184 flex-col border border-gray-200 bg-white/60">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <p className="text-xs font-medium text-gray-700">Live preview</p>
        <p className="text-xs text-gray-400">{loading ? "Rendering..." : "Draft"}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <article>
          <header className="border-b border-gray-200 pb-6 text-center">
            <p className="text-xs text-gray-400">{formatPreviewDate(createdAt)}</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-medium leading-tight text-blue-900">
              {title.trim() || "Untitled post"}
            </h2>
            {description.trim() && <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">{description}</p>}
            {normalizedTags.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {normalizedTags.map((tag) => (
                  <span key={tag} className="border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="mt-6 border border-gray-200 bg-white/50 p-5">
            {error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : compiledSource ? (
              <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24 prose-headings:font-medium prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-a:no-underline prose-p:leading-7 prose-li:leading-7 prose-code:before:content-none prose-code:after:content-none prose-pre:my-6 prose-pre:rounded-none prose-pre:bg-transparent prose-img:my-8 prose-img:rounded-none">
                <MDXRemote {...compiledSource} components={previewMdxComponents} />
              </div>
            ) : (
              <p className="text-sm text-gray-400">Start writing to preview the post.</p>
            )}
          </div>
        </article>
      </div>
    </aside>
  );
}
