import { createClient } from "@/lib/supabase/server";
import { getAssetUrl } from "@/lib/supabase/storage";

const DEFAULT_HOME_BLOG_LIMIT = 4;
const MAX_HOME_BLOG_LIMIT = 50;
const DEFAULT_AUTHOR_BIO =
  "This article was written by Nirav Pandey. He is a third year undergraduate studying Data Science.";
const DEFAULT_AUTHOR_HEADSHOT_PATH = "headshot.png";

export type AuthorProfile = {
  bio: string;
  headshotUrl: string;
};

/** How many posts the home page lists. Falls back to a default if the setting is missing or invalid. */
export async function getHomeBlogLimit() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "home_blog_limit")
    .maybeSingle();

  if (error) return DEFAULT_HOME_BLOG_LIMIT;

  const value = Number(data?.value);
  if (!Number.isInteger(value) || value < 0) return DEFAULT_HOME_BLOG_LIMIT;
  return Math.min(value, MAX_HOME_BLOG_LIMIT);
}

/** The author card shown under each blog post, with defaults for any missing field. */
export async function getAuthorProfile(): Promise<AuthorProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("author_profile")
    .select("bio, headshot_path")
    .eq("id", 1)
    .maybeSingle();

  const profile = error ? null : data;
  const bio = profile?.bio?.trim() || DEFAULT_AUTHOR_BIO;
  const headshotPath = profile?.headshot_path?.trim() || DEFAULT_AUTHOR_HEADSHOT_PATH;

  return { bio, headshotUrl: getAssetUrl(headshotPath) };
}
