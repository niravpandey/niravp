import { getPublishedPosts } from "@/lib/blog";
import { getProjects } from "@/lib/projects";
import { getSkillCategories } from "@/lib/skills";
import { getExperiences } from "@/lib/experience";
import { getHomeBlogLimit } from "@/lib/site-settings";
import { getHeadshotUrls } from "@/lib/headshots";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const [posts, projects, skillCategories, experiences, homeBlogLimit, headshots] = await Promise.all([
    getPublishedPosts(),
    getProjects(),
    getSkillCategories(),
    getExperiences(),
    getHomeBlogLimit(),
    getHeadshotUrls(),
  ]);

  return (
    <HomeClient
      posts={posts.slice(0, homeBlogLimit)}
      projects={projects}
      skillCategories={skillCategories}
      experiences={experiences}
      headshots={headshots}
    />
  );
}
