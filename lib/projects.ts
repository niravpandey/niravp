import { createClient } from "@/lib/supabase/server";

export type ProjectSkill = {
  id: string;
  name: string;
  icon_path: string | null;
  icon_url: string | null;
};

export type Project = {
  id: string;
  title: string;
  org: string;
  description: string;
  tags: string[];
  link: string;
  sort_order: number;
  image_path: string | null;
  image_alt: string;
  image_url: string | null;
  skill_ids: string[];
  skills: ProjectSkill[];
};

export async function getProjects() {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("projects")
    .select("id, title, org, description, tags, link, sort_order, image_path, image_alt")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // Keep the site online if the app deploys just before the portfolio SQL is run.
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    const legacyResult = await supabase
      .from("projects")
      .select("id, title, org, description, tags, link, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    data = (legacyResult.data ?? []).map((project) => ({
      ...project,
      image_path: null,
      image_alt: "",
    }));
    error = legacyResult.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  const { data: links, error: linkError } = await supabase
    .from("project_skills")
    .select("project_id, skill_id, skills(id, name, icon_path)");

  const normalizedLinks = linkError ? [] : (links ?? []);

  return (data ?? []).map((project) => ({
    ...project,
    tags: Array.isArray(project.tags) ? project.tags : [],
    image_path: project.image_path ?? null,
    image_alt: project.image_alt ?? "",
    image_url: project.image_path
      ? supabase.storage.from("Assets").getPublicUrl(project.image_path).data.publicUrl
      : null,
    skill_ids: normalizedLinks
      .filter((link) => link.project_id === project.id)
      .map((link) => link.skill_id),
    skills: normalizedLinks
      .filter((link) => link.project_id === project.id && link.skills)
      .flatMap((link) => {
        const value = Array.isArray(link.skills) ? link.skills[0] : link.skills;
        return value
          ? [{
              id: value.id,
              name: value.name,
              icon_path: value.icon_path,
              icon_url: value.icon_path
                ? supabase.storage.from("Assets").getPublicUrl(value.icon_path).data.publicUrl
                : null,
            }]
          : [];
      }),
  }));
}
