import { createClient } from "@/lib/supabase/server";

export type Project = {
  id: string;
  title: string;
  org: string;
  description: string;
  tags: string[];
  link: string;
  sort_order: number;
};

export async function getProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, org, description, tags, link, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((project) => ({
    ...project,
    tags: Array.isArray(project.tags) ? project.tags : [],
  }));
}
