import { getPublishedPosts } from "@/lib/blog";
import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";
 
export default async function Home() {
  const posts = await getPublishedPosts();
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, progress, color")
    .eq("status", "reading")
    .order("created_at", { ascending: false });
 
  return <HomeClient posts={posts} books={books ?? []} />;
}
 