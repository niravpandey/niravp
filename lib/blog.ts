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
};

export type PostSummary = Omit<Post, "content">;

/** Public: only published posts, ordered newest first */
export async function getPublishedPosts(): Promise<PostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, description, tags, published, created_at, cover_image")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Public: single published post by slug — returns null if missing or unpublished */
export const getPublishedPost = cache(async (slug: string): Promise<Post | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) return null;
  return data;
});

/** Admin: all posts regardless of published state */
export async function getAllPosts(): Promise<PostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, description, tags, published, created_at, cover_image")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Admin: single post by id */
export const getPostById = cache(async (id: string): Promise<Post | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
});
