import { getPublishedPosts } from "@/lib/blog";
import { getProjects } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const [posts, projects] = await Promise.all([getPublishedPosts(), getProjects()]);
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, status, progress")
    .order("created_at", { ascending: false });

  return <HomeClient posts={posts} books={books ?? []} projects={projects} />;
}
