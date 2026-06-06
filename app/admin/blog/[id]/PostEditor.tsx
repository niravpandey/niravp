"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import imageCompression from "browser-image-compression";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import BlogImage from "@/components/blog/BlogImage";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { Post } from "@/lib/blog";
import { createClient } from "@/lib/supabase/client";
import { compilePostPreview, deletePost, savePost, type PostFormData } from "./actions";

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

type BlogImage = {
  name: string;
  path: string;
  publicUrl: string;
};

type PreviewSource = MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>;
type EditorPreviewPaneMode = "split" | "editor" | "preview";

const BLOG_BUCKET_NAME = "Blog";
const BLOG_IMAGE_LIMIT = 10;
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_UPLOAD_SIZE_MB = 1.9;
const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|heic|jpe?g|png|webp)$/i;

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

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function getFileExtension(file: File) {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/png") {
    return "png";
  }

  return extensionFromName ?? "jpg";
}

function getImageAltText(name: string) {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/^\d+-/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Blog image";
}

function escapeMdxAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function getImageMdxSnippet(image: BlogImage) {
  return [
    "<BlogImage",
    `  src="${escapeMdxAttribute(image.publicUrl)}"`,
    `  alt="${escapeMdxAttribute(getImageAltText(image.name))}"`,
    '  width="50%"',
    '  align="center"',
    "/>",
  ].join("\n");
}

async function compressImage(file: File) {
  if (file.size <= MAX_UPLOAD_SIZE_BYTES) {
    return file;
  }

  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    throw new Error(`${file.name} is larger than 2MB and cannot be compressed automatically.`);
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_UPLOAD_SIZE_MB,
    maxWidthOrHeight: 2000,
    useWebWorker: false,
    fileType: "image/webp",
    initialQuality: 0.85,
    maxIteration: 20,
  });

  if (compressed.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`${file.name} could not be compressed below 2MB.`);
  }

  const compressedName = file.name.replace(/\.[^/.]+$/, ".webp");

  return new File([compressed], compressedName, {
    type: compressed.type,
    lastModified: Date.now(),
  });
}

async function listBlogImages(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.storage
    .from(BLOG_BUCKET_NAME)
    .list("", {
      limit: BLOG_IMAGE_LIMIT,
      sortBy: { column: "name", order: "desc" },
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/") && IMAGE_FILE_PATTERN.test(item.name))
    .map((item) => {
      const { data: urlData } = supabase.storage
        .from(BLOG_BUCKET_NAME)
        .getPublicUrl(item.name);

      return {
        name: item.name,
        path: item.name,
        publicUrl: urlData.publicUrl,
      };
    }) as BlogImage[];
}

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
        "overflow-x-auto border border-gray-200 bg-gray-950 px-4 py-3 text-sm leading-6 text-gray-100",
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

function BlogPreview({
  compiledSource,
  description,
  error,
  loading,
  title,
  tags,
  createdAt,
}: {
  compiledSource: PreviewSource | null;
  description: string;
  error: string | null;
  loading: boolean;
  title: string;
  tags: string;
  createdAt: string;
}) {
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
              <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24 prose-headings:font-medium prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-a:no-underline prose-p:leading-7 prose-li:leading-7 prose-code:before:content-none prose-code:after:content-none prose-pre:my-6 prose-pre:rounded-none prose-img:my-8 prose-img:rounded-none">
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
  const [supabase] = useState(createClient);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [published, setPublished] = useState(post?.published ?? false);
  const [blogImages, setBlogImages] = useState<BlogImage[]>([]);
  const [createdAt, setCreatedAt] = useState(
    post?.created_at ? toDatetimeLocalValue(post.created_at) : toDatetimeLocalValue(new Date().toISOString())
  );
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageWidgetVisible, setImageWidgetVisible] = useState(true);
  const [imageWidgetPosition, setImageWidgetPosition] = useState<{ x: number; y: number } | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<PreviewSource | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editorPreviewSplit, setEditorPreviewSplit] = useState(58);
  const [editorPreviewPaneMode, setEditorPreviewPaneMode] = useState<EditorPreviewPaneMode>("split");
  const [isPending, startTransition] = useTransition();
  const markdownInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorPreviewGridRef = useRef<HTMLDivElement | null>(null);
  const imageWidgetRef = useRef<HTMLElement | null>(null);
  const imageWidgetDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  async function refreshBlogImages() {
    setImagesLoading(true);
    setImageError(null);

    try {
      const images = await listBlogImages(supabase);
      setBlogImages(images);
    } catch (cause: unknown) {
      setImageError(cause instanceof Error ? cause.message : "Failed to load blog images.");
    } finally {
      setImagesLoading(false);
    }
  }

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

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setImagesLoading(true);
    setImageError(null);
    setImageStatus(null);

    try {
      for (const file of Array.from(files)) {
        setImageStatus(`Compressing ${file.name}...`);

        const uploadFile = await compressImage(file);
        const fileExt = getFileExtension(uploadFile);
        const baseName = uploadFile.name.replace(/\.[^/.]+$/, "");
        const safeBaseName = baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const fileName = `${Date.now()}-${safeBaseName || "image"}.${fileExt}`;

        setImageStatus(`Uploading ${uploadFile.name} (${formatFileSize(file.size)} -> ${formatFileSize(uploadFile.size)})...`);

        const { error: uploadError } = await supabase.storage
          .from(BLOG_BUCKET_NAME)
          .upload(fileName, uploadFile, {
            cacheControl: "3600",
            contentType: uploadFile.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }
      }

      setImageStatus("Image upload complete.");
      await refreshBlogImages();
    } catch (cause: unknown) {
      setImageError(cause instanceof Error ? cause.message : "Failed to upload image.");
    } finally {
      event.target.value = "";
      setImagesLoading(false);
    }
  }

  function insertImageMarkdown(image: BlogImage) {
    const textarea = contentTextareaRef.current;
    const imageSnippet = getImageMdxSnippet(image);

    if (!textarea) {
      setContent((current) => `${current}${current.endsWith("\n") || current.length === 0 ? "" : "\n\n"}${imageSnippet}`);
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const before = content.slice(0, selectionStart);
    const after = content.slice(selectionEnd);
    const prefix = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const suffix = after.length === 0 || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const nextContent = `${before}${prefix}${imageSnippet}${suffix}${after}`;
    const nextCursorPosition = before.length + prefix.length + imageSnippet.length;

    setContent(nextContent);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  function handleImageWidgetPointerDown(event: React.PointerEvent<HTMLElement>) {
    const widget = imageWidgetRef.current;

    if (!widget) {
      return;
    }

    const rect = widget.getBoundingClientRect();
    imageWidgetDragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setImageWidgetPosition({ x: rect.left, y: rect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleImageWidgetPointerMove(event: React.PointerEvent<HTMLElement>) {
    const drag = imageWidgetDragRef.current;
    const widget = imageWidgetRef.current;

    if (!drag || !widget) {
      return;
    }

    const rect = widget.getBoundingClientRect();
    const maxX = Math.max(8, window.innerWidth - rect.width - 8);
    const maxY = Math.max(8, window.innerHeight - rect.height - 8);
    const nextX = Math.min(Math.max(8, event.clientX - drag.offsetX), maxX);
    const nextY = Math.min(Math.max(8, event.clientY - drag.offsetY), maxY);

    setImageWidgetPosition({ x: nextX, y: nextY });
  }

  function handleImageWidgetPointerUp(event: React.PointerEvent<HTMLElement>) {
    imageWidgetDragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function updateEditorPreviewSplit(clientX: number) {
    const grid = editorPreviewGridRef.current;

    if (!grid) {
      return;
    }

    const rect = grid.getBoundingClientRect();
    const nextSplit = ((clientX - rect.left) / rect.width) * 100;

    if (nextSplit < 9) {
      setEditorPreviewPaneMode("preview");
      return;
    }

    if (nextSplit > 91) {
      setEditorPreviewPaneMode("editor");
      return;
    }

    const clampedSplit = Math.min(Math.max(nextSplit, 35), 75);

    setEditorPreviewPaneMode("split");
    setEditorPreviewSplit(clampedSplit);
  }

  function handleEditorPreviewResizePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateEditorPreviewSplit(event.clientX);
  }

  function handleEditorPreviewResizePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    updateEditorPreviewSplit(event.clientX);
  }

  function handleEditorPreviewResizePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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

  useEffect(() => {
    let cancelled = false;

    async function loadInitialBlogImages() {
      try {
        const images = await listBlogImages(supabase);

        if (!cancelled) {
          setBlogImages(images);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setImageError(cause instanceof Error ? cause.message : "Failed to load blog images.");
        }
      } finally {
        if (!cancelled) {
          setImagesLoading(false);
        }
      }
    }

    void loadInitialBlogImages();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!content.trim()) {
        setPreviewSource(null);
        setPreviewError(null);
        setPreviewLoading(false);
        return;
      }

      setPreviewLoading(true);

      compilePostPreview(content)
        .then((compiled) => {
          if (!cancelled) {
            setPreviewSource(compiled);
            setPreviewError(null);
          }
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            setPreviewSource(null);
            setPreviewError(cause instanceof Error ? cause.message : "Could not render preview.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPreviewLoading(false);
          }
        });
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [content]);

  return (
    <div className="mx-auto w-full max-w-6xl">
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

      <div className="grid grid-cols-1 gap-6">
        <div className="min-w-0">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div>
            {editorPreviewPaneMode !== "split" && (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditorPreviewPaneMode("split")}
                  className="border border-gray-300 bg-white/60 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:border-gray-400"
                >
                  {editorPreviewPaneMode === "editor" ? "Show preview" : "Show editor"}
                </button>
              </div>
            )}

            <div
              ref={editorPreviewGridRef}
              className={[
                "grid grid-cols-1 gap-6",
                editorPreviewPaneMode === "split"
                  ? "xl:grid-cols-[minmax(0,var(--editor-pane-width))_0.75rem_minmax(0,var(--preview-pane-width))] xl:items-start xl:gap-3"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  "--editor-pane-width": `${editorPreviewSplit}fr`,
                  "--preview-pane-width": `${100 - editorPreviewSplit}fr`,
                } as React.CSSProperties
              }
            >
              {editorPreviewPaneMode !== "preview" && (
                <div className="flex h-184 flex-col overflow-hidden border border-gray-200 bg-white/60">
                  <textarea
                    ref={contentTextareaRef}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write your MDX here..."
                    className="min-h-0 flex-1 resize-none border-0 px-4 py-3 font-mono text-sm text-gray-800 focus:outline-none"
                  />
                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                    <span>{importedFileName ? `Markdown editor · loaded ${importedFileName}` : "Markdown editor"}</span>
                    <span>{isPending ? "Saving..." : "⌘S to save draft"}</span>
                  </div>
                </div>
              )}

              {editorPreviewPaneMode === "split" && (
                <div
                  role="separator"
                  aria-label="Resize editor and preview"
                  aria-orientation="vertical"
                  className="group hidden h-184 cursor-col-resize touch-none items-center justify-center xl:flex"
                  onPointerDown={handleEditorPreviewResizePointerDown}
                  onPointerMove={handleEditorPreviewResizePointerMove}
                  onPointerUp={handleEditorPreviewResizePointerUp}
                  onPointerCancel={handleEditorPreviewResizePointerUp}
                >
                  <div className="relative flex h-full w-3 items-center justify-center">
                    <div className="h-full w-0.5 bg-gray-300 transition-colors group-hover:bg-gray-500" />
                    <div className="absolute h-10 w-1.5 bg-white ring-1 ring-gray-300 transition-colors group-hover:ring-gray-500" />
                  </div>
                </div>
              )}

              {editorPreviewPaneMode !== "editor" && (
                <BlogPreview
                  compiledSource={previewSource}
                  createdAt={createdAt}
                  description={description}
                  error={previewError}
                  loading={previewLoading}
                  tags={tags}
                  title={title}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setImageWidgetVisible((visible) => !visible)}
        className="fixed right-3 bottom-18 z-30 inline-flex items-center gap-2 border border-gray-300 bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-400"
      >
        <PhosphorIcon name="folder-open" size={16} />
        <span>{imageWidgetVisible ? "Hide images" : "Show images"}</span>
      </button>

      {imageWidgetVisible && (
        <aside
          ref={imageWidgetRef}
          className="fixed z-30 w-72 border border-gray-200 bg-white/95 p-3 shadow-sm"
          style={
            imageWidgetPosition
              ? { left: `${imageWidgetPosition.x}px`, top: `${imageWidgetPosition.y}px` }
              : { right: "1.5rem", top: "6rem" }
          }
        >
          <div
            className="mb-3 flex cursor-move touch-none select-none items-center justify-between gap-3 border-b border-gray-200 pb-2"
            onPointerDown={handleImageWidgetPointerDown}
            onPointerMove={handleImageWidgetPointerMove}
            onPointerUp={handleImageWidgetPointerUp}
            onPointerCancel={handleImageWidgetPointerUp}
          >
            <div>
              <p className="text-sm font-medium text-gray-800">Blog images</p>
              <p className="mt-0.5 text-xs text-gray-400">Latest {BLOG_IMAGE_LIMIT}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  void refreshBlogImages();
                }}
                disabled={imagesLoading}
                title="Refresh images"
                className="inline-flex h-8 w-8 items-center justify-center border border-gray-300 text-gray-500 transition-colors hover:border-gray-400 disabled:opacity-40"
              >
                <PhosphorIcon name="folder-open" size={16} />
              </button>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setImageWidgetVisible(false);
                }}
                title="Hide images"
                className="inline-flex h-8 w-8 items-center justify-center border border-gray-300 text-gray-500 transition-colors hover:border-gray-400"
              >
                <PhosphorIcon name="caret-right" size={16} />
              </button>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={imagesLoading}
            className="mb-2 inline-flex w-full items-center justify-center gap-2 border border-gray-300 px-2 py-1.5 text-xs text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-40"
          >
            <PhosphorIcon name="upload-simple" size={16} />
            <span>{imagesLoading ? "Working..." : "Upload images"}</span>
          </button>

          {imageError && <p className="mb-2 border border-red-200 bg-white/70 px-2 py-1.5 text-xs text-red-500">{imageError}</p>}
          {imageStatus && <p className="mb-2 border border-green-200 bg-white/70 px-2 py-1.5 text-xs text-green-600">{imageStatus}</p>}

          <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pr-1">
            {blogImages.length === 0 ? (
              <div className="border border-gray-200 bg-white/70 p-3 text-xs text-gray-500">
                {imagesLoading ? "Loading images..." : "No blog images yet."}
              </div>
            ) : (
              blogImages.map((image) => (
                <div key={image.path} className="group flex min-w-0 gap-2 border border-gray-200 bg-white p-1.5">
                  <div
                    className="relative shrink-0 overflow-hidden bg-gray-100"
                    style={{ width: "56px", height: "48px" }}
                  >
                    <img
                      src={image.publicUrl}
                      alt={getImageAltText(image.name)}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => insertImageMarkdown(image)}
                      className="absolute inset-1 inline-flex items-center justify-center gap-1 border border-gray-900 bg-white/90 px-1.5 py-1 text-xs font-medium text-gray-900 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100"
                    >
                      <PhosphorIcon name="file-plus" size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center">
                    <p className="truncate text-xs text-gray-500" title={image.name}>
                      {image.name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
