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
  /** "post" for the blog, "note" for /notes. Both live in the posts table. */
  kind: PostKind;
  subject: string | null;
  topic: string | null;
  position: number | null;
  updated_at: string | null;
};

export type PostKind = "post" | "note";

export type PostSummary = Omit<Post, "content" | "kind" | "subject" | "topic" | "position" | "updated_at">;

const SUMMARY_COLUMNS = "id, title, slug, description, tags, published, created_at, cover_image, embedding";

/** All published blog posts, newest first. */
export async function getPublishedPosts(): Promise<PostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("kind", "post")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** A single published post, or null if it doesn't exist or isn't published. Cached per request. */
export const getPublishedPost = cache(async (slug: string): Promise<PostSummary & Pick<Post, "content"> | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${SUMMARY_COLUMNS}, content`)
    .eq("kind", "post")
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
    .eq("kind", "post")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load posts for search:", error.message);
    return [];
  }
  return data ?? [];
}

export type AdminPostRow = Pick<
  Post,
  "id" | "title" | "slug" | "published" | "created_at" | "kind" | "subject" | "topic"
> & { pinned: boolean };

/** Admin: all posts and notes, drafts included, pinned first then newest. */
export async function getAllPosts(): Promise<AdminPostRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, published, created_at, pinned, kind, subject, topic")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Admin: a single post by id, drafts included. Cached per request. */
export const getPostById = cache(async (id: string): Promise<Post | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();

  if (error) return null;
  return data;
});

/** Rough word count of an MDX post: ignores code blocks, maths, HTML/JSX tags, links' URLs and image syntax. */
function countWords(source: string) {
  const prose = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ");
  return prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;
}

/** Word counts for published posts, keyed by post id. Never throws: the stats just show nothing. */
export async function getPublishedWordCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("id, content").eq("kind", "post").eq("published", true);

  if (error) {
    console.error("Failed to load posts for word counts:", error.message);
    return {};
  }
  return Object.fromEntries((data ?? []).map((post) => [post.id, countWords(post.content ?? "")]));
}
