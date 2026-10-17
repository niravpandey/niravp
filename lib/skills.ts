import { createClient } from "@/lib/supabase/server";
import { getOptionalAssetUrl } from "@/lib/supabase/storage";

export type Skill = {
  id: string;
  category_id: string;
  name: string;
  icon_path: string | null;
  icon_url: string | null;
  sort_order: number;
};

export type SkillCategory = {
  id: string;
  name: string;
  sort_order: number;
  skills: Skill[];
};

export async function getSkillCategories(): Promise<SkillCategory[]> {
  const supabase = await createClient();

  const [categoriesResult, skillsResult] = await Promise.all([
    supabase
      .from("skill_categories")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("skills")
      .select("id, category_id, name, icon_path, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (skillsResult.error) throw new Error(skillsResult.error.message);

  const skills = (skillsResult.data ?? []).map((skill) => ({
    ...skill,
    icon_url: getOptionalAssetUrl(skill.icon_path),
  }));

  return (categoriesResult.data ?? []).map((category) => ({
    ...category,
    skills: skills.filter((skill) => skill.category_id === category.id),
  }));
}
