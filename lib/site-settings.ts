import { createClient } from "@/lib/supabase/server";

export const DEFAULT_HOME_BLOG_LIMIT = 4;
export const MAX_HOME_BLOG_LIMIT = 50;
export const DEFAULT_AUTHOR_BIO =
  "This article was written by Nirav Pandey. He is a third year undergraduate studying Data Science.";
export const DEFAULT_AUTHOR_HEADSHOT_PATH = "headshot.png";

export type AuthorProfile = {
  bio: string;
  headshotPath: string;
  headshotUrl: string;
};

export async function getHomeBlogLimit() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "home_blog_limit")
    .maybeSingle();

  // Keep the public site usable before the settings migration has been run.
  if (error) return DEFAULT_HOME_BLOG_LIMIT;

  const value = Number(data?.value);
  if (!Number.isInteger(value) || value < 0) return DEFAULT_HOME_BLOG_LIMIT;
  return Math.min(value, MAX_HOME_BLOG_LIMIT);
}

export async function getAuthorProfile(): Promise<AuthorProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("author_profile")
    .select("bio, headshot_path")
    .eq("id", 1)
    .maybeSingle();

  const bio = !error && data?.bio?.trim() ? data.bio.trim() : DEFAULT_AUTHOR_BIO;
  const headshotPath = !error && data?.headshot_path?.trim()
    ? data.headshot_path.trim()
    : DEFAULT_AUTHOR_HEADSHOT_PATH;
  const headshotUrl = supabase.storage.from("Assets").getPublicUrl(headshotPath).data.publicUrl;

  return { bio, headshotPath, headshotUrl };
}
