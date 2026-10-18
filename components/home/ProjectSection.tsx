"use client";

import { useState } from "react";
import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Project } from "@/lib/projects";

const COLLAPSED_SKILL_COUNT = 3;

type ProjectSectionProps = {
  projects: Project[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
};

export default function ProjectSection({ projects, currentIndex, setCurrentIndex }: ProjectSectionProps) {
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(() => new Set());

  const heading = (
    <SectionHeading className="pt-4">
      Projects
    </SectionHeading>
  );

  if (projects.length === 0) {
    return (
      <div>
        {heading}
        <p className="mt-4 text-sm text-gray-500">No projects published yet.</p>
      </div>
    );
  }

  const project = projects[currentIndex];
  const skillNames = project.skills.length > 0 ? project.skills.map((skill) => skill.name) : project.tags;
  const isExpanded = expandedProjectIds.has(project.id);
  const visibleSkills = isExpanded ? skillNames : skillNames.slice(0, COLLAPSED_SKILL_COUNT);
  const hiddenSkillCount = skillNames.length - visibleSkills.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === projects.length - 1;

  function expandSkills() {
    setExpandedProjectIds((current) => new Set(current).add(project.id));
  }

  return (
    <div className="flex h-full flex-col">
      {heading}

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
            {hiddenSkillCount > 0 && (
              <button
                type="button"
                onClick={expandSkills}
                aria-label={`Show ${hiddenSkillCount} more skills for ${project.title}`}
                title="Show all skills"
                className="inline-flex items-center gap-0.5 rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600 transition-colors hover:border-mauve-500 hover:bg-mauve-200 hover:text-mauve-500"
              >
                <PhosphorIcon name="plus" size={10} />
                {hiddenSkillCount}
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={isFirst}
              aria-label="Previous project"
              className="p-1 disabled:opacity-30"
            >
              <PhosphorIcon name="caret-left" size={10} />
            </button>
            <span className="text-xs text-gray-500">
              {currentIndex + 1} / {projects.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={isLast}
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
