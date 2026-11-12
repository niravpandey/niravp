import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import type { SkillCategory } from "@/lib/skills";

export default function SkillSection({ categories }: { categories: SkillCategory[] }) {
  return (
    <div>
      <SectionHeading className="pt-4">
        Skills
      </SectionHeading>

      {/* One row per category: small label on the left, its tiles on the right. Hovering a tile shows its name. */}
      <div className="mt-4 flex flex-col gap-3">
        {categories
          .filter((category) => category.skills.length > 0)
          .map((category) => (
            <div key={category.id} className="flex items-center gap-4">
              <p className="w-24 shrink-0 text-sm text-gray-500">{category.name}</p>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="group relative flex h-9 min-w-9 items-center justify-center rounded-md border border-line bg-white p-1.5"
                  >
                    {skill.icon_url ? (
                      <Image src={skill.icon_url} alt={skill.name} width={24} height={24} unoptimized className="h-6 w-6 object-contain" />
                    ) : (
                      // No icon: the tile widens to fit the full name.
                      <span className="px-0.5 text-xs text-gray-600">{skill.name}</span>
                    )}
                    {/* Name label above the tile, shown instantly on hover. */}
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line bg-white px-1.5 py-0.5 text-xs text-gray-900 group-hover:block">
                      {skill.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
