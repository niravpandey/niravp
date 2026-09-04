import PhosphorIcon from "@/components/ui/PhosphorIcon";
import Image from "next/image";
import type { SkillCategory } from "@/lib/skills";

interface Props {
  categories: SkillCategory[];
  activeSkillIds: Set<string>;
  activeSkillNames: Set<string>;
}

export default function SkillSection({ categories, activeSkillIds, activeSkillNames }: Props) {
  return (
    <div>
      <h1 className="flex items-center gap-2 pt-4 text-3xl font-semibold text-blue-900">
        <PhosphorIcon name="code" size={28} className="text-mauve-500" />Skills
        
      </h1>
      <div className="mt-4 flex flex-col gap-3">
        {categories.map((category) => (
          <div key={category.id} className="flex gap-4">
            <span className="w-32 shrink-0 text-sm text-gray-500">{category.name}</span>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => {
                const active = activeSkillIds.has(skill.id) || activeSkillNames.has(skill.name);
                return (
                <span
                  key={skill.id}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors duration-150 ${
                    active
                      ? "border-mauve-500 text-mauve-500 bg-mauve-200"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {skill.icon_url && (
                    <Image src={skill.icon_url} alt="" width={12} height={12} unoptimized className="h-3 w-3 object-contain" />
                  )}
                  {skill.name}
                </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
