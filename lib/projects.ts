import { createClient } from "@/lib/supabase/server";
import { getOptionalAssetUrl } from "@/lib/supabase/storage";

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

// Postgres / PostgREST codes for "column does not exist".
const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ProjectRow = Omit<Project, "image_path" | "image_alt" | "image_url" | "skill_ids" | "skills"> & {
  image_path?: string | null;
  image_alt?: string | null;
};

type LinkedSkill = Omit<ProjectSkill, "icon_url">;

type SkillLinkRow = {
  project_id: string;
  skill_id: string;
  // PostgREST may return the joined row as an object or a one-element array.
  skills: LinkedSkill | LinkedSkill[] | null;
};

async function fetchProjectRows(supabase: SupabaseClient): Promise<ProjectRow[]> {
  const query = (columns: string) =>
    supabase
      .from("projects")
      .select(columns)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

  const result = await query("id, title, org, description, tags, link, sort_order, image_path, image_alt");

  // Keep the site online if the app deploys before the image columns exist.
  if (result.error && MISSING_COLUMN_CODES.has(result.error.code)) {
    const legacy = await query("id, title, org, description, tags, link, sort_order");
    if (legacy.error) throw new Error(legacy.error.message);
    return (legacy.data ?? []) as unknown as ProjectRow[];
  }

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as unknown as ProjectRow[];
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const [rows, linksResult] = await Promise.all([
    fetchProjectRows(supabase),
    supabase.from("project_skills").select("project_id, skill_id, skills(id, name, icon_path)"),
  ]);

  // Skill links are optional decoration; ignore errors so projects still render.
  const links = (linksResult.error ? [] : linksResult.data ?? []) as SkillLinkRow[];

  return rows.map((project) => {
    const projectLinks = links.filter((link) => link.project_id === project.id);

    const skills = projectLinks.flatMap((link) => {
      const skill = Array.isArray(link.skills) ? link.skills[0] : link.skills;
      if (!skill) return [];
      return [{ ...skill, icon_url: getOptionalAssetUrl(skill.icon_path) }];
    });

    return {
      ...project,
      tags: Array.isArray(project.tags) ? project.tags : [],
      image_path: project.image_path ?? null,
      image_alt: project.image_alt ?? "",
      image_url: getOptionalAssetUrl(project.image_path),
      skill_ids: projectLinks.map((link) => link.skill_id),
      skills,
    };
  });
}
