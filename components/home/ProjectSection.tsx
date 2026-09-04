"use client";
import { useState } from "react";
import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { Project } from "@/lib/projects";

interface Props {
  projects: Project[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
}

export default function ProjectSection({ projects, currentIndex, setCurrentIndex }: Props) {
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(() => new Set());

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
  const skillNames = project.skills.length > 0
    ? project.skills.map((skill) => skill.name)
    : project.tags;
  const isExpanded = expandedProjectIds.has(project.id);
  const visibleSkills = isExpanded ? skillNames : skillNames.slice(0, 3);
  const remainingSkillCount = skillNames.length - visibleSkills.length;

  return (
    <div className="flex h-full flex-col">
      <h1 className="flex items-center gap-2 pt-4 text-3xl font-semibold text-blue-900">
        <PhosphorIcon name="folder-simple-star" size={28} className="text-mauve-500" />Projects
        
      </h1>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex flex-1 gap-4">
          {project.image_url && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-gray-200 bg-gray-100 sm:h-28 sm:w-28">
              <Image
                src={project.image_url}
                alt={project.image_alt || `${project.title} preview`}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
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
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {visibleSkills.map((skillName) => (
              <span key={skillName} className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600">
                {skillName}
              </span>
            ))}
            {remainingSkillCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setExpandedProjectIds((current) => {
                    const next = new Set(current);
                    next.add(project.id);
                    return next;
                  });
                }}
                aria-label={`Show ${remainingSkillCount} more skills for ${project.title}`}
                title="Show all skills"
                className="inline-flex items-center gap-0.5 rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600 transition-colors hover:border-mauve-500 hover:bg-mauve-200 hover:text-mauve-500"
              >
                <PhosphorIcon name="plus" size={10} />
                {remainingSkillCount}
              </button>
            )}
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
