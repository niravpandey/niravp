import { createClient } from "@/lib/supabase/server";
import { getAssetUrl } from "@/lib/supabase/storage";

/** Folder in the "Assets" bucket holding the home page headshots. */
export const HEADSHOTS_FOLDER = "headshots";

/** Used when the folder is empty, so the home page always has a picture. */
const FALLBACK_HEADSHOT_PATH = "headshot.png";

const IMAGE_FILE = /\.(png|jpe?g|webp|avif|gif)$/i;

export type Headshot = { path: string; url: string };

/**
 * Headshot file names start with their position, e.g. "003-<uuid>.jpg", so the order lives in storage
 * without a database table. Files without a number (older uploads) sort after numbered ones.
 */
export function headshotPosition(name: string) {
  const match = /^(\d+)-/.exec(name);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

export function headshotFileName(position: number, extension: string) {
  return `${String(position).padStart(3, "0")}-${crypto.randomUUID()}.${extension}`;
}

/** Image files from a folder listing, in display order. Expects the listing sorted oldest first. */
export function orderHeadshotFiles<T extends { name: string }>(files: T[]): T[] {
  return files
    .filter((file) => IMAGE_FILE.test(file.name))
    .map((file, index) => ({ file, index }))
    .sort((a, b) => headshotPosition(a.file.name) - headshotPosition(b.file.name) || a.index - b.index)
    .map(({ file }) => file);
}

/** Every headshot in the folder, in display order. */
export async function getHeadshots(): Promise<Headshot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("Assets")
    .list(HEADSHOTS_FOLDER, { limit: 100, sortBy: { column: "created_at", order: "asc" } });

  if (error) {
    console.error("Failed to list headshots:", error.message);
    return [];
  }

  // Skips Supabase's ".emptyFolderPlaceholder" and anything that isn't an image.
  return orderHeadshotFiles(data ?? []).map((file) => {
    const path = `${HEADSHOTS_FOLDER}/${file.name}`;
    return { path, url: getAssetUrl(path) };
  });
}

/** URLs for the home page to rotate through, falling back to the single headshot.png. */
export async function getHeadshotUrls(): Promise<string[]> {
  const headshots = await getHeadshots();
  return headshots.length > 0 ? headshots.map((headshot) => headshot.url) : [getAssetUrl(FALLBACK_HEADSHOT_PATH)];
}
