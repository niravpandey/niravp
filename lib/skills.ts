import { createClient } from "@/lib/supabase/server";

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

export function getAssetPublicUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null,
) {
  if (!path) return null;
  return supabase.storage.from("Assets").getPublicUrl(path).data.publicUrl;
}

export async function getSkillCategories(): Promise<SkillCategory[]> {
  const supabase = await createClient();
  const [{ data: categories, error: categoryError }, { data: skills, error: skillError }] =
    await Promise.all([
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

  if (categoryError) throw new Error(categoryError.message);
  if (skillError) throw new Error(skillError.message);

  return (categories ?? []).map((category) => ({
    ...category,
    skills: (skills ?? [])
      .filter((skill) => skill.category_id === category.id)
      .map((skill) => ({
        ...skill,
        icon_url: getAssetPublicUrl(supabase, skill.icon_path),
      })),
  }));
}
