"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { Post } from "@/lib/blog";
import { createClient } from "@/lib/supabase/client";
import { compilePostPreview, deletePost, savePost, type PostFormData } from "./actions";
import BlogPreview from "./BlogPreview";
import BlogImagesTool from "./BlogImagesTool";
import DrawingPadTool from "./DrawingPadTool";
import FocusOverlays from "./FocusOverlays";
import PomodoroTool from "./PomodoroTool";
import ResizeDivider from "./ResizeDivider";
import WritingToolsSidebar from "./WritingToolsSidebar";
import {
  BLOG_BUCKET_NAME,
  BREAK_SECONDS,
  DEFAULT_POMODORO_MINUTES,
  DEFAULT_POMODORO_SESSIONS,
  TOOL_SIDEBAR_DEFAULT_REM,
  TOOL_SIDEBAR_MAX_REM,
  TOOL_SIDEBAR_MIN_REM,
  clamp,
  compressImage,
  formatFileSize,
  getFileExtension,
  getImageMdxSnippet,
  listBlogImages,
  parseFrontmatter,
  toDatetimeLocalValue,
  type BlogImage as BlogImageItem,
  type EditorPreviewPaneMode,
  type PreviewSource,
  type ToolDensity,
  type WritingToolKey,
} from "./editorUtils";

type Props = {
  post: Post | null;
};

export default function PostEditor({ post }: Props) {
  const isNew = !post;
  const [supabase] = useState(createClient);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [published, setPublished] = useState(post?.published ?? false);
  const [blogImages, setBlogImages] = useState<BlogImageItem[]>([]);
  const [createdAt, setCreatedAt] = useState(
    post?.created_at ? toDatetimeLocalValue(post.created_at) : toDatetimeLocalValue(new Date().toISOString())
  );
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [openTools, setOpenTools] = useState<Record<WritingToolKey, boolean>>({
    images: true,
    timer: false,
    drawing: false,
  });
  const [toolSidebarWidthRem, setToolSidebarWidthRem] = useState(TOOL_SIDEBAR_DEFAULT_REM);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(DEFAULT_POMODORO_MINUTES);
  const [pomodoroTargetSessions, setPomodoroTargetSessions] = useState(DEFAULT_POMODORO_SESSIONS);
  const [pomodoroCompletedSessions, setPomodoroCompletedSessions] = useState(0);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(DEFAULT_POMODORO_MINUTES * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(BREAK_SECONDS);
  const [breakOpen, setBreakOpen] = useState(false);
  const [breakRunning, setBreakRunning] = useState(false);
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawingUploading, setDrawingUploading] = useState(false);
  const [drawingExpanded, setDrawingExpanded] = useState(false);
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
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorPreviewGridRef = useRef<HTMLDivElement | null>(null);
  const toolsLayoutRef = useRef<HTMLDivElement | null>(null);
  const toolDensity: ToolDensity =
    toolSidebarWidthRem <= 14.5 ? "icon" : toolSidebarWidthRem <= 17 ? "compact" : "comfortable";

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

    if (publish && !coverImage) {
      setError("Thumbnail is required before publishing.");
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
      coverImage,
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

  async function handleImageDelete(image: BlogImageItem) {
    if (!confirm(`Delete ${image.name} from the Blog bucket?`)) {
      return;
    }

    setImagesLoading(true);
    setImageError(null);
    setImageStatus(null);

    try {
      const { data: deletedObjects, error: deleteError } = await supabase.storage
        .from(BLOG_BUCKET_NAME)
        .remove([image.path]);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      if (!deletedObjects || deletedObjects.length === 0) {
        throw new Error("Supabase did not delete that image. Check the Blog bucket delete RLS policy.");
      }

      setBlogImages((images) => images.filter((item) => item.path !== image.path));
      setImageStatus(null);
      await refreshBlogImages();
    } catch (cause: unknown) {
      setImageError(cause instanceof Error ? cause.message : "Failed to delete image.");
    } finally {
      setImagesLoading(false);
    }
  }

  function insertImageMarkdown(image: BlogImageItem) {
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

  function updateToolSidebarWidth(clientX: number) {
    const layout = toolsLayoutRef.current;

    if (!layout) {
      return;
    }

    const rect = layout.getBoundingClientRect();
    const nextWidthRem = (rect.right - clientX) / 16;
    setToolSidebarWidthRem(clamp(nextWidthRem, TOOL_SIDEBAR_MIN_REM, TOOL_SIDEBAR_MAX_REM));
  }

  function toggleTool(tool: WritingToolKey) {
    setOpenTools((current) => ({
      ...current,
      [tool]: !current[tool],
    }));
  }

  function resetPomodoro() {
    setPomodoroRunning(false);
    setBreakRunning(false);
    setBreakOpen(false);
    setCongratsOpen(false);
    setBreakSeconds(BREAK_SECONDS);
    setPomodoroCompletedSessions(0);
    setPomodoroSeconds(pomodoroMinutes * 60);
  }

  function cancelBreak() {
    setBreakRunning(false);
    setBreakOpen(false);
    setBreakSeconds(BREAK_SECONDS);
    setPomodoroSeconds(pomodoroMinutes * 60);
  }

  function skipBreak() {
    setBreakRunning(false);
    setBreakOpen(false);
    setBreakSeconds(BREAK_SECONDS);
    setPomodoroSeconds(pomodoroMinutes * 60);
    setPomodoroRunning(true);
  }

  function adjustPomodoroMinutes(delta: number) {
    const nextMinutes = clamp(pomodoroMinutes + delta, 1, 120);

    setPomodoroMinutes(nextMinutes);
    if (!pomodoroRunning) {
      setPomodoroSeconds(nextMinutes * 60);
    }
  }

  function handlePomodoroSessionsChange(value: string) {
    const nextSessions = clamp(Number.parseInt(value, 10) || 2, 2, 10);

    setPomodoroTargetSessions(nextSessions);
    setPomodoroCompletedSessions((completed) => Math.min(completed, nextSessions));
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = drawingCanvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handleDrawingPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = drawingCanvasRef.current;
    const point = getCanvasPoint(event);

    if (!canvas || !point) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    setDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    context.strokeStyle = "#1f2937";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function handleDrawingPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = drawingCanvasRef.current;
    const point = getCanvasPoint(event);

    if (!drawing || !canvas || !point) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function handleDrawingPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    setDrawing(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function clearDrawing() {
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function uploadDrawing() {
    const canvas = drawingCanvasRef.current;

    if (!canvas) {
      return;
    }

    setDrawingUploading(true);
    setImageError(null);
    setImageStatus(null);

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });

      if (!blob) {
        throw new Error("Could not export drawing.");
      }

      const fileName = `${Date.now()}-drawing.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      const { error: uploadError } = await supabase.storage
        .from(BLOG_BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setImageStatus("Drawing uploaded.");
      clearDrawing();
      await refreshBlogImages();
      setOpenTools((current) => ({ ...current, images: true }));
    } catch (cause: unknown) {
      setImageError(cause instanceof Error ? cause.message : "Failed to upload drawing.");
    } finally {
      setDrawingUploading(false);
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

  useEffect(() => {
    if (!pomodoroRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setPomodoroSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setPomodoroRunning(false);
          setPomodoroCompletedSessions((completed) => {
            const nextCompleted = Math.min(completed + 1, pomodoroTargetSessions);

            if (nextCompleted >= pomodoroTargetSessions) {
              setBreakOpen(false);
              setBreakRunning(false);
              setCongratsOpen(true);
            } else {
              setBreakSeconds(BREAK_SECONDS);
              setBreakOpen(true);
              setBreakRunning(true);
            }

            return nextCompleted;
          });
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pomodoroRunning, pomodoroTargetSessions]);

  useEffect(() => {
    if (!breakOpen || !breakRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setBreakSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setBreakRunning(false);
          setBreakOpen(false);
          setPomodoroSeconds(pomodoroMinutes * 60);
          return BREAK_SECONDS;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [breakOpen, breakRunning, pomodoroMinutes]);

  return (
    <div className="mx-auto w-full max-w-7xl">
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

      <div
        ref={toolsLayoutRef}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_0.75rem_minmax(13rem,var(--tools-width))] xl:items-start xl:gap-3"
        style={{ "--tools-width": `${toolSidebarWidthRem}rem` } as React.CSSProperties}
      >
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
          
          <div className="mb-6 flex flex-col items-center">
            <label className="mb-1 block text-xs text-gray-500">Thumbnail</label>

            <div className="flex items-center gap-4">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Thumbnail preview"
                  className="h-28 w-44 rounded border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-28 w-44 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400">
                  No thumbnail
                </div>
              )}
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
                <ResizeDivider
                  ariaLabel="Resize editor and preview"
                  className="h-184"
                  onResize={updateEditorPreviewSplit}
                />
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

        <ResizeDivider
          ariaLabel="Resize writing tools"
          className="h-184 xl:sticky xl:top-6"
          onResize={updateToolSidebarWidth}
        />

        <WritingToolsSidebar density={toolDensity}>
          <BlogImagesTool
            open={openTools.images}
            density={toolDensity}
            images={blogImages}
            loading={imagesLoading}
            error={imageError}
            status={imageStatus}
            inputRef={imageInputRef}
            onToggleOpen={() => toggleTool("images")}
            onUploadChange={handleImageUpload}
            onInsertImage={insertImageMarkdown}
            onSelectCoverImage={(image) => setCoverImage(image.publicUrl)}
            onDeleteImage={(image) => void handleImageDelete(image)}
          />

          <PomodoroTool
            open={openTools.timer}
            density={toolDensity}
            seconds={pomodoroSeconds}
            minutes={pomodoroMinutes}
            running={pomodoroRunning}
            completedSessions={pomodoroCompletedSessions}
            targetSessions={pomodoroTargetSessions}
            onToggleOpen={() => toggleTool("timer")}
            onAdjustMinutes={adjustPomodoroMinutes}
            onTargetSessionsChange={handlePomodoroSessionsChange}
            onStartPause={() => {
              setCongratsOpen(false);
              setBreakOpen(false);
              setBreakRunning(false);
              setPomodoroRunning((running) => {
                if (running) {
                  return false;
                }

                if (pomodoroCompletedSessions >= pomodoroTargetSessions) {
                  setPomodoroCompletedSessions(0);
                }

                if (pomodoroSeconds <= 0) {
                  setPomodoroSeconds(pomodoroMinutes * 60);
                }

                return true;
              });
            }}
            onReset={resetPomodoro}
          />

          <DrawingPadTool
            open={openTools.drawing}
            density={toolDensity}
            expanded={drawingExpanded}
            uploading={drawingUploading}
            canvasRef={drawingCanvasRef}
            onToggleOpen={() => toggleTool("drawing")}
            onExpandedChange={setDrawingExpanded}
            onPointerDown={handleDrawingPointerDown}
            onPointerMove={handleDrawingPointerMove}
            onPointerUp={handleDrawingPointerUp}
            onClear={clearDrawing}
            onUpload={() => void uploadDrawing()}
          />
        </WritingToolsSidebar>
      </div>

      <FocusOverlays
        breakOpen={breakOpen}
        breakSeconds={breakSeconds}
        congratsOpen={congratsOpen}
        targetSessions={pomodoroTargetSessions}
        onCancelBreak={cancelBreak}
        onSkipBreak={skipBreak}
        onCloseCongrats={() => setCongratsOpen(false)}
        onResetPomodoro={resetPomodoro}
      />
    </div>
  );
}
