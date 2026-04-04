"use client";
import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ProjectSection from "@/components/ProjectSection";
import SkillSection from "@/components/SkillSection";
import BlogSection from "@/components/BlogSection";
import ReadingSection from "@/components/ReadingSection";
import Footer from "@/components/Footer";
import type { PostSummary } from "@/lib/blog";

type Book = { id: string; title: string; author: string; progress: number; color: string };
 
const projects = [
  {
    title: "Automated Newsletter System",
    org: "Data Science Student Society",
    description:
      "Built a smart newsletter system with an event recommendation engine based on user interaction tracking. Tested with simulated data across 100 users and 400 events.",
    tags: ["Python", "Supabase", "GitHub Actions", "CI/CD"],
    link: "https://github.com",
  },
  {
    title: "AI Study Planner",
    org: "Personal Project",
    description:
      "A web app that generates personalised study schedules using the OpenAI API. Users input their subjects and deadlines, and the planner breaks down tasks day by day.",
    tags: ["Next.js", "React", "OpenAI API", "PostgreSQL"],
    link: "https://github.com",
  },
  {
    title: "REST API Boilerplate",
    org: "Personal Project",
    description:
      "A production-ready FastAPI boilerplate with JWT auth, PostgreSQL integration, scheduled jobs, and automated email workflows. Designed to be cloned and extended.",
    tags: ["FastAPI", "PostgreSQL", "REST APIs", "Email Automation", "Scheduled Jobs"],
    link: "https://github.com",
  },
  {
    title: "Campus Event Tracker",
    org: "University Hackathon",
    description:
      "Full-stack event discovery platform for university students. Features real-time updates, MongoDB-backed storage, and a Node.js backend with a React frontend.",
    tags: ["React", "Node.js", "MongoDB", "Figma"],
    link: "https://github.com",
  },
];
 
export default function HomeClient({ posts, books }: { posts: PostSummary[]; books: Book[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeSkills = new Set(projects[currentIndex].tags);
 
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 flex-col items-center py-16 sm:py-32 px-4 sm:px-8 lg:px-16 bg-olive-100 w-full sm:items-start">
        <HeroSection />
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-gray-200 pb-5">
          <SkillSection activeSkills={activeSkills} />
          <ProjectSection
            projects={projects}
            currentIndex={currentIndex}
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
