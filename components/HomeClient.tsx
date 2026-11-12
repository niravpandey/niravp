"use client";

import { useState } from "react";
import BlogSection from "@/components/home/BlogSection";
import ExperienceSection from "@/components/home/ExperienceSection";
import GallerySection from "@/components/home/GallerySection";
import HeroSection from "@/components/home/HeroSection";
import ProjectSection from "@/components/home/ProjectSection";
import SkillSection from "@/components/home/SkillSection";
import StudentMapSection from "@/components/home/StudentMapSection";
import Footer from "@/components/layout/Footer";
import type { PostSummary } from "@/lib/blog";
import type { Experience } from "@/lib/experience";
import type { Project } from "@/lib/projects";
import type { SkillCategory } from "@/lib/skills";
import type { StudentMapData } from "@/lib/student-map";

type HomeClientProps = {
  posts: PostSummary[];
  projects: Project[];
  skillCategories: SkillCategory[];
  experiences: Experience[];
  studentMap: StudentMapData | null;
};

export default function HomeClient({ posts, projects, skillCategories, experiences, studentMap }: HomeClientProps) {
  const [projectIndex, setProjectIndex] = useState(0);

  return (
    <div className="home-dreamy-bg flex min-h-screen flex-1 flex-col items-center justify-center font-sans">
      {/* Gallery strip at the top, set off from the navbar. */}
      <div className="w-full pt-4 sm:pt-6">
        <GallerySection />
      </div>

      <main className="flex w-full flex-1 flex-col items-center px-4 pt-8 pb-6 sm:items-start sm:px-8 sm:pt-12 sm:pb-8 lg:px-16">
        <HeroSection />

        <div className="grid w-full grid-cols-1 gap-6 border-b border-line pb-5 lg:grid-cols-2 [&>*]:min-w-0">
          <SkillSection categories={skillCategories} />
          <ProjectSection projects={projects} currentIndex={projectIndex} setCurrentIndex={setProjectIndex} />
        </div>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 [&>*]:min-w-0">
          <ExperienceSection experiences={experiences} />
          <BlogSection posts={posts} />
        </div>

        <div className="w-full">
          <StudentMapSection map={studentMap} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
