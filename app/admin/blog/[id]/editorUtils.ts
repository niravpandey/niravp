"use client";

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export type ImportedFrontmatter = {
  title?: string;
  slug?: string;
  description?: string;
  tags?: string;
  published?: boolean;
  createdAt?: string;
};

export type BlogImage = {
  name: string;
  path: string;
  publicUrl: string;
};

export type PreviewSource = MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>;
export type EditorPreviewPaneMode = "split" | "editor" | "preview";
export type WritingToolKey = "images" | "timer" | "drawing";
export type ToolDensity = "comfortable" | "compact" | "icon";

export const BLOG_BUCKET_NAME = "Blog";
export const BLOG_IMAGE_LIMIT = 10;
export const DEFAULT_POMODORO_MINUTES = 25;
export const DEFAULT_POMODORO_SESSIONS = 4;
export const BREAK_SECONDS = 5 * 60;
export const TOOL_SIDEBAR_MIN_REM = 13;
export const TOOL_SIDEBAR_MAX_REM = 22;
export const TOOL_SIDEBAR_DEFAULT_REM = 15;

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_UPLOAD_SIZE_MB = 1.9;
const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|heic|jpe?g|png|webp)$/i;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function toDatetimeLocalValue(value: string) {
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

export function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

export function formatPomodoroTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function getFileExtension(file: File) {
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

export function getImageAltText(name: string) {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/^\d+-/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Blog image";
}

function escapeMdxAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function getImageMdxSnippet(image: BlogImage) {
  return [
    "<BlogImage",
    `  src="${escapeMdxAttribute(image.publicUrl)}"`,
    `  alt="${escapeMdxAttribute(getImageAltText(image.name))}"`,
    '  width="50%"',
    '  align="center"',
    "/>",
  ].join("\n");
}

export async function compressImage(file: File) {
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

export async function listBlogImages(supabase: ReturnType<typeof createClient>) {
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

export function parseFrontmatter(source: string): { content: string; data: ImportedFrontmatter } {
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

    const key = keyValueMatch[1];
    const rawValue = keyValueMatch[2].trim();

    if (rawValue) {
      fields[key] = stripWrappingQuotes(rawValue);
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
