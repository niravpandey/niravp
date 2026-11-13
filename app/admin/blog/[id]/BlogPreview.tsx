"use client";

import { useEffect, useRef, useState } from "react";
import { MDXRemote } from "next-mdx-remote";
import BlogImage from "@/components/blog/BlogImage";
import type { PreviewSource } from "./editorUtils";
import {
  INLINE_EDITABLE_SELECTOR,
  beginInlineEdit,
  clickToSourceRange,
  findElementAtOffset,
  selectionToSourceRange,
  type InlineEditResult,
  type SourceRange,
} from "./sourceSync";

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
      className={["border-b border-line bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.ComponentPropsWithoutRef<"td">) => (
    <td className={["border-t border-line/50 px-4 py-3 align-top leading-6 text-gray-700", className].filter(Boolean).join(" ")} {...props} />
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
  /** The markdown the current preview was compiled from (offsets refer to this). */
  sourceText: string;
  /** Editor caret; the preview element it falls in is marked. */
  activeOffset: number | null;
  onJumpToSource: (range: SourceRange) => void;
  /** False while the preview is behind the editor; inline edits need exact offsets. */
  canEditInline: boolean;
  onEditSource: (start: number, end: number, text: string) => void;
};

export default function BlogPreview({
  compiledSource,
  description,
  error,
  loading,
  title,
  tags,
  createdAt,
  sourceText,
  activeOffset,
  onJumpToSource,
  canEditInline,
  onEditSource,
}: BlogPreviewProps) {
  const [editMode, setEditMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Inline edits change the DOM behind React's back, so the MDX tree is remounted afterwards:
  // straight away on cancel, or once the edited source has re-rendered (so the edit doesn't flicker back).
  const [remountCount, setRemountCount] = useState(0);
  const [editedAgainst, setEditedAgainst] = useState<PreviewSource | null>(null);
  const mdxKey = editedAgainst !== null && compiledSource === editedAgainst ? remountCount - 1 : remountCount;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // True right after a preview selection jumped the editor: the text is already on screen here.
  const jumpedFromPreviewRef = useRef(false);

  // Mark the element under the editor caret, and keep it in view.
  useEffect(() => {
    const body = bodyRef.current;
    const scroller = scrollRef.current;
    if (!body || !scroller) return;

    body.querySelectorAll("[data-src-active]").forEach((element) => element.removeAttribute("data-src-active"));
    if (activeOffset === null) return;

    const element = findElementAtOffset(body, activeOffset);
    if (!element) return;

    element.setAttribute("data-src-active", "");

    if (jumpedFromPreviewRef.current) {
      jumpedFromPreviewRef.current = false;
      return;
    }

    // Only scroll when the element is fully out of view, so long paragraphs don't make the preview jump.
    const box = element.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    if (box.bottom < view.top || box.top > view.bottom) {
      scroller.scrollTop += box.top - view.top - view.height / 3;
    }
  }, [activeOffset, compiledSource]);

  function handleInlineEditDone(result: InlineEditResult, editedSource: PreviewSource | null) {
    setRemountCount((count) => count + 1);

    if (result.kind === "edit") {
      setEditedAgainst(editedSource);
      onEditSource(result.start, result.end, result.text);
      return;
    }

    setEditedAgainst(null);

    if (result.kind === "rejected") {
      setNotice("That edit touches formatting, so it was not applied. It's selected in the editor.");
      if (result.range) onJumpToSource(result.range);
    }
  }

  function handleMouseUp(event: React.MouseEvent<HTMLDivElement>) {
    const body = bodyRef.current;
    const selection = window.getSelection();
    if (!body || !selection) return;

    setNotice(null);

    if (editMode && canEditInline && event.target instanceof Element) {
      if (event.target.closest("[data-src-editing]")) return;

      const block = event.target.closest<HTMLElement>(INLINE_EDITABLE_SELECTOR);
      const onAtomic = event.target.closest("[data-src-atomic]");

      if (block && body.contains(block) && !onAtomic) {
        const editedSource = compiledSource;
        beginInlineEdit(block, body, sourceText, { x: event.clientX, y: event.clientY }, (result) =>
          handleInlineEditDone(result, editedSource),
        );
        return;
      }
    }

    const range = selection.isCollapsed
      ? clickToSourceRange(event.target, body)
      : selectionToSourceRange(selection, body, sourceText);

    if (range) {
      jumpedFromPreviewRef.current = true;
      onJumpToSource(range);
      // Clear the flag even if the caret didn't actually move (no effect run).
      window.setTimeout(() => {
        jumpedFromPreviewRef.current = false;
      }, 50);
    }
  }

  const normalizedTags = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <aside className="flex h-184 flex-col border border-line bg-white/60">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <p className="text-xs font-medium text-gray-700">Live preview</p>
        <p className="flex items-baseline gap-3 text-xs text-gray-400">
          <span>
            {loading
              ? "Rendering..."
              : editMode
                ? "Click text to edit · Enter saves · Esc cancels"
                : "Select text to find it in the editor"}
          </span>
          <button
            type="button"
            onClick={() => setEditMode((on) => !on)}
            aria-pressed={editMode}
            className="text-blue-900 underline decoration-gray-300 underline-offset-2 hover:decoration-current"
          >
            edit here: {editMode ? "on" : "off"}
          </button>
        </p>
      </div>
      {notice && <p className="border-b border-line bg-white px-4 py-1.5 text-xs text-red-700">{notice}</p>}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        <article>
          <header className="border-b border-line pb-6 text-center">
            <p className="text-xs text-gray-400">{formatPreviewDate(createdAt)}</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-medium leading-tight text-blue-900">
              {title.trim() || "Untitled post"}
            </h2>
            {description.trim() && <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">{description}</p>}
            {normalizedTags.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {normalizedTags.map((tag) => (
                  <span key={tag} className="border border-line px-2 py-0.5 text-xs text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="mt-6 border border-line bg-white/50 p-5">
            {error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : compiledSource ? (
              <div
                ref={bodyRef}
                onMouseUp={handleMouseUp}
                onClick={(event) => {
                  // Links shouldn't navigate away while their text is being edited.
                  if (editMode && event.target instanceof Element && event.target.closest("a")) event.preventDefault();
                }}
                className={[
                  editMode
                    ? "[&_:is(p,li,h1,h2,h3,h4,h5,h6,td,th)]:cursor-text [&_:is(p,li,h1,h2,h3,h4,h5,h6,td,th):hover]:outline-1 [&_:is(p,li,h1,h2,h3,h4,h5,h6,td,th):hover]:outline-dashed [&_:is(p,li,h1,h2,h3,h4,h5,h6,td,th):hover]:outline-gray-300"
                    : "",
                  "[&_[data-src-editing]]:bg-white [&_[data-src-editing]]:outline-dashed! [&_[data-src-editing]]:outline-1 [&_[data-src-editing]]:outline-blue-900!",
                  "prose prose-gray [&_[data-src-atomic]]:cursor-pointer [&_[data-src-active]]:bg-mauve-500/10 [&_[data-src-active]]:outline-2 [&_[data-src-active]]:outline-offset-2 [&_[data-src-active]]:outline-mauve-500/30 max-w-none prose-headings:scroll-mt-24 prose-headings:font-medium prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:border-b prose-h2:border-line prose-h2:pb-2 prose-a:no-underline prose-p:leading-7 prose-li:leading-7 prose-code:before:content-none prose-code:after:content-none prose-pre:my-6 prose-pre:rounded-none prose-pre:bg-transparent prose-img:my-8 prose-img:rounded-none",
                ].join(" ")}
              >
                <MDXRemote key={mdxKey} {...compiledSource} components={previewMdxComponents} />
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
