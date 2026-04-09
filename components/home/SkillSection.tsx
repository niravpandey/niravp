import { CodeXml } from "lucide-react";

interface Props {
  activeSkills: Set<string>;
}

export default function SkillSection({ activeSkills }: Props) {
  const skills = [
    { category: "Languages", items: ["Python", "Java", "SQL", "JavaScript"] },
    { category: "Web & Frameworks", items: ["React", "Next.js", "FastAPI", "Node.js", "HTML", "CSS"] },
    { category: "Backend & APIs", items: ["REST APIs", "OpenAI API", "Email Automation", "Scheduled Jobs"] },
    { category: "Databases", items: ["PostgreSQL", "MongoDB", "MySQL", "Supabase"] },
    { category: "Tools", items: ["Git", "GitHub Actions", "Postman", "Figma"] },
  ];

  return (
    <div>
      <h1 className="flex items-center gap-2 pt-4 text-3xl font-semibold text-blue-900">
        <CodeXml className="h-7 w-7 text-mauve-500" aria-hidden="true" />Skills
        
      </h1>
      <div className="mt-4 flex flex-col gap-3">
        {skills.map(({ category, items }) => (
          <div key={category} className="flex gap-4">
            <span className="text-sm text-gray-500 w-32 shrink-0">{category}</span>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item}
                  className={`text-xs border px-2 py-0.5 transition-colors duration-150 ${
                    activeSkills.has(item)
                      ? "border-mauve-500 text-mauve-500 bg-mauve-200"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
