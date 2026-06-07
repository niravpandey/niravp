"use client";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
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
        <h1 className="flex items-center gap-2 pt-4 text-3xl font-semibold text-blue-900">
          <PhosphorIcon name="folder-simple-star" size={28} className="text-mauve-500" />Projects
          
        </h1>
        <p className="mt-4 text-sm text-gray-500">No projects published yet.</p>
      </div>
    );
  }

  const project = projects[currentIndex];

  return (
    <div className="flex h-full flex-col">
      <h1 className="flex items-center gap-2 pt-4 text-3xl font-semibold text-blue-900">
        <PhosphorIcon name="folder-simple-star" size={28} className="text-mauve-500" />Projects
        
      </h1>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex flex-1 flex-col">
          <div className="flex items-baseline justify-between">
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1 font-medium hover:underline"
            >
              {project.title}
              <PhosphorIcon
                name="arrow-square-out"
                size={14}
                className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
            </a>
            <span className="text-sm text-gray-500">{project.org}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{project.description}</p>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              aria-label="Previous project"
              className="p-1 disabled:opacity-30"
            >
              <PhosphorIcon name="caret-left" size={10} />
            </button>
            <span className="text-xs text-gray-500">
              {currentIndex + 1} / {projects.length}
            </span>
            <button
              onClick={() => setCurrentIndex(Math.min(projects.length - 1, currentIndex + 1))}
              disabled={currentIndex === projects.length - 1}
              aria-label="Next project"
              className="p-1 disabled:opacity-30"
            >
              <PhosphorIcon name="caret-right" size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
