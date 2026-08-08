import { getPublishedPosts } from "@/lib/blog";
import { getProjects } from "@/lib/projects";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const [posts, projects] = await Promise.all([getPublishedPosts(), getProjects()]);

  return <HomeClient posts={posts} projects={projects} />;
}
