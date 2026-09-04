import { createClient } from "@/lib/supabase/server";

export const DEFAULT_HOME_BLOG_LIMIT = 4;
export const MAX_HOME_BLOG_LIMIT = 50;

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
