import { getPublishedPosts } from "@/lib/blog";
import { getProjects } from "@/lib/projects";
import { getSkillCategories } from "@/lib/skills";
import { getExperiences } from "@/lib/experience";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const [posts, projects, skillCategories, experiences] = await Promise.all([
    getPublishedPosts(),
    getProjects(),
    getSkillCategories(),
    getExperiences(),
  ]);

  return <HomeClient posts={posts} projects={projects} skillCategories={skillCategories} experiences={experiences} />;
}
