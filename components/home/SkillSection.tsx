import PhosphorIcon from "@/components/ui/PhosphorIcon";

interface Props {
  activeSkills: Set<string>;
}

export default function SkillSection({ activeSkills }: Props) {
  const skills = [
  { category: "Languages", items: ["Python", "Java", "SQL", "JavaScript", "C"] },
  { category: "Frontend", items: ["React", "Next.js", "HTML/CSS"] },
  { category: "Backend", items: ["FastAPI", "Node.js", "REST APIs"] },
  { category: "Databases", items: ["PostgreSQL", "MongoDB", "MySQL", "Supabase"] },
  { category: "Tools & Platforms", items: ["Git", "GitHub Actions", "Postman", "Figma"] },
  { category: "Other", items: ["OpenAI API", "Email Automation", "Scheduled Jobs"] },
];

  return (
    <div>
      <h1 className="flex items-center gap-2 pt-4 text-3xl font-semibold text-blue-900">
        <PhosphorIcon name="code" size={28} className="text-mauve-500" />Skills
        
      </h1>
      <div className="mt-4 flex flex-col gap-3">
        {skills.map(({ category, items }) => (
          <div key={category} className="flex gap-4">
            <span className="text-sm text-gray-500 w-32 shrink-0">{category}</span>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item}
                  className={`text-xs border rounded-full px-2 py-0.5 transition-colors duration-150 ${
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
