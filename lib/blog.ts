import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Post = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  tags: string[] | null;
  published: boolean;
  created_at: string;
  cover_image: string | null;
  embedding: number[] | string | null;
};

export type PostSummary = Omit<Post, "content">;

const SUMMARY_COLUMNS = "id, title, slug, description, tags, published, created_at, cover_image, embedding";

/** All published posts, newest first. */
export async function getPublishedPosts(): Promise<PostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** A single published post, or null if it doesn't exist or isn't published. Cached per request. */
export const getPublishedPost = cache(async (slug: string): Promise<Post | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${SUMMARY_COLUMNS}, content`)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) return null;
  return data;
});

export type SearchablePost = Pick<Post, "title" | "slug" | "description" | "tags" | "created_at">;

/** Lightweight list of published posts for the site-wide search. Never throws: search just shows nothing. */
export async function getSearchablePosts(): Promise<SearchablePost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("title, slug, description, tags, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load posts for search:", error.message);
    return [];
  }
  return data ?? [];
}
