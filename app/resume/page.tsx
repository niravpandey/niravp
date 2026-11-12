import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import DownloadResumeButton from "@/components/resume/DownloadResumeButton";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { cn } from "@/lib/utils";

// The page title is also the file name the browser suggests when saving as PDF.
export const metadata: Metadata = {
  title: "Nirav Pandey - Resume",
  description: "Resume of Nirav Pandey",
};

// Plain Markdown source, editable by hand or with AI. See the format notes at the top of the file.
const RESUME_PATH = path.join(process.cwd(), "content", "resume.md");

const mdxOptions = {
  mdxOptions: {
    // Parse as plain Markdown, not MDX, so characters like < and { in the text are safe.
    format: "md" as const,
    remarkPlugins: [remarkGfm],
  },
};

/** Splits "Left | Right" heading text so the right part (dates, places) sits on the right. */
function splitEntry(children: ReactNode) {
  if (typeof children !== "string" || !children.includes(" | ")) return { left: children, right: null };
  const [left, ...rest] = children.split(" | ");
  return { left, right: rest.join(" | ") };
}

const resumeComponents = {
  h1: ({ className, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1 className={cn("font-serif text-[22pt] font-heading leading-tight text-heading", className)} {...props} />
  ),
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={cn(
        "mt-[5mm] border-b border-gray-300 pb-[1mm] font-serif text-[12pt] font-heading uppercase tracking-wide text-heading",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ children, className, ...props }: ComponentPropsWithoutRef<"h3">) => {
    const { left, right } = splitEntry(children);
    return (
      <h3 className={cn("mt-[3mm] flex items-baseline justify-between gap-4 font-bold", className)} {...props}>
        <span>{left}</span>
        {right && <span className="shrink-0 font-normal text-gray-600">{right}</span>}
      </h3>
    );
  },
  p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => <p className={cn("mt-[1mm]", className)} {...props} />,
  ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className={cn("mt-[1mm] list-disc space-y-[0.5mm] pl-[5mm] marker:text-gray-400", className)} {...props} />
  ),
  em: ({ className, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className={cn("text-gray-700", className)} {...props} />
  ),
  a: ({ className, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a className={cn("text-blue-900 underline-offset-2 hover:underline", className)} {...props} />
  ),
};

export default async function ResumePage() {
  const source = await fs.readFile(RESUME_PATH, "utf8");

  return (
    <main className="flex flex-1 flex-col items-center px-3 py-6 sm:px-8 sm:py-10 print:p-0">
      {/* Toolbar, hidden when printing / saving as PDF. */}
      <div className="mb-4 flex w-full max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
          <PhosphorIcon name="arrow-left" size={16} />
          <span>home</span>
        </Link>
        <DownloadResumeButton />
      </div>

      {/* The A4 sheet: 210 x 297 mm on screen (narrower on phones), exactly one A4 page when printed. */}
      <article className="resume-sheet w-full max-w-[210mm] border border-line bg-white px-5 py-6 text-[10pt] leading-snug text-gray-900 shadow-[0_8px_30px_color-mix(in_oklab,var(--ink)_12%,transparent)] sm:min-h-[297mm] sm:px-[16mm] sm:py-[14mm]">
        <MDXRemote source={source} options={mdxOptions} components={resumeComponents} />
      </article>
    </main>
  );
}
