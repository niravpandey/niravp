import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site-url";

/** Public pages that aren't backed by a post. Admin, login and API routes are left out (see robots.ts). */
const STATIC_PAGES = ["", "/blog", "/notes", "/resume", "/subscribe", "/design"];

/** /sitemap.xml: the fixed pages plus every published blog post and note, newest edit as lastModified. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug, kind, created_at, updated_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const posts = (data ?? []).map((post) => ({
    url: `${SITE_URL}/${post.kind === "note" ? "notes" : "blog"}/${post.slug}`,
    lastModified: post.updated_at ?? post.created_at,
  }));

  return [...STATIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` })), ...posts];
}
