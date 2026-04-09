"use client";

import { useState } from "react";
import HeroSection from "@/components/home/HeroSection";
import ProjectSection from "@/components/home/ProjectSection";
import SkillSection from "@/components/home/SkillSection";
import BlogSection from "@/components/home/BlogSection";
import ReadingSection from "@/components/home/ReadingSection";
import Footer from "@/components/layout/Footer";
import type { PostSummary } from "@/lib/blog";
import type { Project } from "@/lib/projects";
import type { Book } from "@/lib/books";
import Navbar from "./layout/Navbar";

type HomeClientProps = {
  posts: PostSummary[];
  books: Book[];
  projects: Project[];
};

export default function HomeClient({
  posts,
  books,
  projects,
}: HomeClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeCurrentIndex =
    projects.length > 0 ? Math.min(currentIndex, projects.length - 1) : 0;

  const activeSkills = new Set(projects[safeCurrentIndex]?.tags ?? []);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center font-sans">
      
      <main className=" flex w-full flex-1 flex-col items-center px-4 py-16 sm:items-start sm:px-8 sm:py-32 lg:px-16">
        
        <HeroSection />

        <div className="grid w-full grid-cols-1 gap-6 border-b border-gray-200 pb-5 lg:grid-cols-2">
          <SkillSection activeSkills={activeSkills} />
          <ProjectSection
            projects={projects}
            currentIndex={safeCurrentIndex}
            setCurrentIndex={setCurrentIndex}
          />
          <ReadingSection books={books} />
          <BlogSection posts={posts} />
        </div>
      </main>

      <Footer />
    </div>
  );
}