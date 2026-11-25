import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous, cookie-free client for reading public content (published posts, notes, projects, settings).
 *
 * Reading cookies makes Next render a page on every request, so public pages use this instead of
 * lib/supabase/server.ts. That lets them be prerendered and cached; admin saves call revalidatePath
 * to refresh them. Use the server client for anything that depends on who is signed in.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
