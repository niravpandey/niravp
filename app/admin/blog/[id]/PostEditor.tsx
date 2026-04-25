"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { Post } from "@/lib/blog";
import { deletePost, savePost, type PostFormData } from "./actions";

type Props = {
  post: Post | null;
};

type ImportedFrontmatter = {
  title?: string;
  slug?: string;
  description?: string;
  tags?: string;
  published?: boolean;
  createdAt?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFrontmatter(source: string): { content: string; data: ImportedFrontmatter } {
  const lines = source.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    return { content: source, data: {} };
  }

  const fields: Record<string, string | string[]> = {};
  let currentListKey: string | null = null;
  let closingIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim() === "---") {
      closingIndex = index;
      break;
    }

    const listItemMatch = line.match(/^\s*-\s+(.*)$/);

    if (listItemMatch && currentListKey) {
      const currentValue = fields[currentListKey];
      const nextItem = stripWrappingQuotes(listItemMatch[1]);

      fields[currentListKey] = Array.isArray(currentValue)
        ? [...currentValue, nextItem]
        : [nextItem];
      continue;
    }

    currentListKey = null;

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!keyValueMatch) {
      continue;
    }

    const [, key, rawValue] = keyValueMatch;
    const value = stripWrappingQuotes(rawValue);

    if (value) {
      fields[key] = value;
      continue;
    }

    fields[key] = [];
    currentListKey = key;
  }

  if (closingIndex === -1) {
    return { content: source, data: {} };
  }

  const publishedValue = fields.published;
  const createdAtValue = fields.createdAt ?? fields.created_at ?? fields.date;
  const normalizedCreatedAt =
    typeof createdAtValue === "string" && !Number.isNaN(Date.parse(createdAtValue))
      ? new Date(createdAtValue).toISOString()
      : undefined;

  return {
    content: lines.slice(closingIndex + 1).join("\n").replace(/^\n+/, ""),
    data: {
      title: typeof fields.title === "string" ? fields.title : undefined,
      slug: typeof fields.slug === "string" ? fields.slug : undefined,
      description: typeof fields.description === "string" ? fields.description : undefined,
      tags:
        typeof fields.tags === "string"
          ? fields.tags
          : Array.isArray(fields.tags)
            ? fields.tags.join(", ")
            : undefined,
      published:
        typeof publishedValue === "string"
          ? publishedValue.toLowerCase() === "true"
          : undefined,
      createdAt: normalizedCreatedAt,
    },
  };
}

export default function PostEditor({ post }: Props) {
  const isNew = !post;
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [published, setPublished] = useState(post?.published ?? false);
  const [createdAt, setCreatedAt] = useState(
    post?.created_at ? toDatetimeLocalValue(post.created_at) : toDatetimeLocalValue(new Date().toISOString())
  );
  const [error, setError] = useState<string | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const markdownInputRef = useRef<HTMLInputElement | null>(null);

  async function handleSave(publish?: boolean) {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!slug.trim()) {
      setError("Slug is required.");
      return;
    }

    setError(null);

    const data: PostFormData = {
      id: post?.id ?? "new",
      title,
      slug,
      description,
      content,
      tags,
      published: publish !== undefined ? publish : published,
      createdAt: new Date(createdAt).toISOString(),
    };

    startTransition(async () => {
      try {
        await savePost(data);
        if (publish !== undefined) {
          setPublished(publish);
        }
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
      }
    });
  }

  async function handleDelete() {
    if (!post?.id) {
      return;
    }

    if (!confirm("Delete this post? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deletePost(post.id);
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : "Delete failed.");
      }
    });
  }

  async function handleMarkdownImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedText = await file.text();
      const imported = parseFrontmatter(importedText);

      setContent(imported.content);
      if (imported.data.title !== undefined) {
        setTitle(imported.data.title);
      }
      if (imported.data.slug !== undefined) {
        setSlug(imported.data.slug.toLowerCase().replace(/\s+/g, "-"));
      }
      if (imported.data.description !== undefined) {
        setDescription(imported.data.description);
      }
      if (imported.data.tags !== undefined) {
        setTags(imported.data.tags);
      }
      if (imported.data.published !== undefined) {
        setPublished(imported.data.published);
      }
      if (imported.data.createdAt !== undefined) {
        setCreatedAt(toDatetimeLocalValue(imported.data.createdAt));
      }

      setImportedFileName(file.name);
      setError(null);
    } catch {
      setError("Could not read that markdown file.");
    } finally {
      event.target.value = "";
    }
  }

  const onSaveShortcut = useEffectEvent(() => {
    if (isPending) {
      return;
    }

    void handleSave();
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();
      onSaveShortcut();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <p className="text-sm text-gray-500">{isNew ? "New post" : "Edit post"}</p>
        <h1 className="mt-1 text-3xl font-semibold text-mauve-500">{isNew ? "Write something new" : "Refine the draft"}</h1>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
          <PhosphorIcon name="arrow-left" size={16} />
          <span>All posts</span>
        </Link>
        <div className="flex items-center gap-2">
          <input
            ref={markdownInputRef}
            type="file"
            accept=".md,.mdx,text/markdown,text/plain"
            className="hidden"
            onChange={handleMarkdownImport}
          />
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="border border-red-700 bg-white/60 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-100 disabled:opacity-40"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => markdownInputRef.current?.click()}
            disabled={isPending}
            className="inline-flex items-center gap-2 border border-gray-300 bg-white/60 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-40"
          >
            <PhosphorIcon name="upload-simple" size={16} />
            <span>Import markdown</span>
          </button>
          <button
            onClick={() => handleSave()}
            disabled={isPending}
            className="border border-gray-300 bg-white/60 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-40"
          >
            {isPending ? "Saving..." : "Save draft"}
          </button>
          {!published ? (
            <button
              onClick={() => handleSave(true)}
              disabled={isPending}
              className="border border-gray-300 bg-white/60 px-3 py-1.5 text-sm text-mauve-500 transition-colors hover:border-gray-400 disabled:opacity-40"
            >
              Publish
            </button>
          ) : (
            <button
              onClick={() => handleSave(false)}
              disabled={isPending}
              className="border border-gray-300 bg-white/60 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-40"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 border border-red-200 bg-white/60 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 border border-gray-200 bg-white/60 p-4 sm:p-5">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Post title"
            className="w-full border border-gray-200 px-3 py-2 text-lg font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Slug <span className="text-gray-300">(url path)</span>
            </label>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="my-post-slug"
              className="w-full border border-gray-200 px-3 py-2 font-mono text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Tags <span className="text-gray-300">(comma separated)</span>
            </label>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="math, cs, life"
              className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Publish date</label>
          <input
            type="datetime-local"
            value={createdAt}
            onChange={(event) => setCreatedAt(event.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">
            Description <span className="text-gray-300">(shown on blog card)</span>
          </label>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A short summary of this post..."
            className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white/60">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your MDX here..."
          className="min-h-120 w-full resize-none border-0 px-4 py-3 font-mono text-sm text-gray-800 focus:outline-none"
        />
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
          <span>{importedFileName ? `Markdown editor · loaded ${importedFileName}` : "Markdown editor"}</span>
          <span>{isPending ? "Saving..." : "⌘S to save draft"}</span>
        </div>
      </div>
    </div>
  );
}
