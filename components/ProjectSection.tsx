"use client";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/projects";

interface Props {
  projects: Project[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
}

export default function ProjectSection({ projects, currentIndex, setCurrentIndex }: Props) {
  if (projects.length === 0) {
    return (
      <div>
        <h1 className="pt-4 text-3xl font-semibold text-mauve-500">Projects</h1>
        <p className="mt-4 text-sm text-gray-500">No projects published yet.</p>
      </div>
    );
  }

  const project = projects[currentIndex];

  return (
    <div>
      <h1 className="text-3xl text-mauve-500 font-semibold pt-4">Projects</h1>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <div className="flex items-baseline justify-between">
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1 font-medium hover:underline"
            >
              {project.title}
              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </a>
            <span className="text-sm text-gray-500">{project.org}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.tags.map((tag) => (
              <span key={tag} className="text-xs border border-gray-300 px-2 py-0.5 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="p-1 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500">
            {currentIndex + 1} / {projects.length}
          </span>
          <button
            onClick={() => setCurrentIndex(Math.min(projects.length - 1, currentIndex + 1))}
            disabled={currentIndex === projects.length - 1}
            className="p-1 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
