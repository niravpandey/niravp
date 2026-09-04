import { createClient } from "@/lib/supabase/server";

export type Experience = {
  id: string;
  title: string;
  subtitle: string;
  organization: string;
  date_range: string;
  description: string;
  logo_path: string | null;
  logo_url: string | null;
  sort_order: number;
};

export async function getExperiences(): Promise<Experience[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiences")
    .select("id, title, subtitle, organization, date_range, description, logo_path, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    // Keep the homepage working before the migration is applied.
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((experience) => ({
    ...experience,
    logo_path: experience.logo_path ?? null,
    logo_url: experience.logo_path
      ? supabase.storage.from("Assets").getPublicUrl(experience.logo_path).data.publicUrl
      : null,
  }));
}
