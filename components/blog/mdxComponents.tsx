import type { ComponentPropsWithoutRef } from "react";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import BlogImage from "@/components/blog/BlogImage";
import { cn } from "@/lib/utils";

/** MDX compile options shared by blog posts and notes: GFM plus KaTeX maths. */
export const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
};

/** Element overrides shared by blog posts and notes. */
export const mdxComponents = {
  a: ({ className, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a
      className={cn(
        "font-medium text-blue-900 underline decoration-gray-300 underline-offset-4 transition-colors hover:decoration-blue-900",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className={cn("overflow-x-auto bg-transparent px-0 py-3 font-mono text-[0.85rem] leading-7 text-gray-700", className)}
      {...props}
    />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => {
    // Fenced code blocks carry a "language-*" class; inline code does not.
    const isBlockCode = className?.includes("language-");

    return (
      <code
        className={cn(
          "font-mono text-[0.9em] tracking-[-0.01em]",
          isBlockCode ? "text-gray-700" : "text-mauve-700",
          className,
        )}
        {...props}
      />
    );
  },
  blockquote: ({ className, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className={cn("border-l-2 border-blue-900 pl-5 text-gray-700 italic", className)} {...props} />
  ),
  BlogImage,
  img: BlogImage,
  table: ({ className, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-8 overflow-x-auto bg-white">
      <table className={cn("my-0 min-w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: ComponentPropsWithoutRef<"tr">) => (
    <tr className={cn("even:bg-gray-50/60", className)} {...props} />
  ),
  th: ({ className, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      className={cn(
        "border-b border-line bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className={cn("border-t border-line/50 px-4 py-3 align-top leading-6 text-gray-700", className)} {...props} />
  ),
};
