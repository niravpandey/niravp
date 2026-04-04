"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Post } from "@/lib/blog";
import { deletePost, savePost, type PostFormData } from "./actions";

type Props = {
  post: Post | null;
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
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <p className="text-sm text-gray-500">{isNew ? "New post" : "Edit post"}</p>
        <h1 className="mt-1 text-3xl font-semibold text-mauve-500">{isNew ? "Write something new" : "Refine the draft"}</h1>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <Link href="/admin/blog" className="text-sm text-gray-500 transition-colors hover:text-gray-800">
          ← All posts
        </Link>
        <div className="flex items-center gap-2">
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

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write your MDX here..."
        className="min-h-120 w-full resize-none border border-gray-200 bg-white/60 px-4 py-3 font-mono text-sm text-gray-800 focus:border-gray-400 focus:outline-none"
      />
    </div>
  );
}
