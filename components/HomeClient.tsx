"use client";
import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ProjectSection from "@/components/ProjectSection";
import SkillSection from "@/components/SkillSection";
import BlogSection from "@/components/BlogSection";
import ReadingSection from "@/components/ReadingSection";
import Footer from "@/components/Footer";
import type { PostSummary } from "@/lib/blog";
import type { Project } from "@/lib/projects";

type Book = { id: string; title: string; author: string; progress: number; color: string };

export default function HomeClient({
  posts,
  books,
  projects,
}: {
  posts: PostSummary[];
  books: Book[];
  projects: Project[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeCurrentIndex = projects.length === 0 ? 0 : Math.min(currentIndex, projects.length - 1);
  const activeSkills = new Set(projects[safeCurrentIndex]?.tags ?? []);
 
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 flex-col items-center py-16 sm:py-32 px-4 sm:px-8 lg:px-16 bg-olive-100 w-full sm:items-start">
        <HeroSection />
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-gray-200 pb-5">
          <SkillSection activeSkills={activeSkills} />
          <ProjectSection
            projects={projects}
            currentIndex={safeCurrentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        </div>
        <ReadingSection books={books} />
        <BlogSection posts = {posts} />
      </main>
      <Footer />
    </div>
  );
}
