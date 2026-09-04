"use client";

import { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/projects";
import type { SkillCategory } from "@/lib/skills";
import { deleteProjectAction, saveProjectAction } from "@/app/admin/portfolio-actions";

const BUCKET_NAME = "Assets";
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

type ProjectForm = {
  title: string;
  org: string;
  description: string;
  link: string;
  sort_order: number;
  image_alt: string;
};

const EMPTY_FORM: ProjectForm = {
  title: "",
  org: "",
  description: "",
  link: "",
  sort_order: 0,
  image_alt: "",
};

async function loadCmsData(supabase: ReturnType<typeof createClient>) {
  const [projectResult, categoryResult, skillResult, linkResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, org, description, tags, link, sort_order, image_path, image_alt")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
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
    supabase.from("project_skills").select("project_id, skill_id"),
  ]);

  if (projectResult.error) throw new Error(projectResult.error.message);
  if (categoryResult.error) throw new Error(categoryResult.error.message);
  if (skillResult.error) throw new Error(skillResult.error.message);
  if (linkResult.error) throw new Error(linkResult.error.message);

  const categories = (categoryResult.data ?? []).map((category) => ({
    ...category,
    skills: (skillResult.data ?? [])
      .filter((skill) => skill.category_id === category.id)
      .map((skill) => ({
        ...skill,
        icon_url: skill.icon_path
          ? supabase.storage.from(BUCKET_NAME).getPublicUrl(skill.icon_path).data.publicUrl
          : null,
      })),
  })) as SkillCategory[];

  const projects = (projectResult.data ?? []).map((project) => {
    const skillIds = (linkResult.data ?? [])
      .filter((link) => link.project_id === project.id)
      .map((link) => link.skill_id);
    const linkedSkills = categories.flatMap((category) => category.skills).filter((skill) => skillIds.includes(skill.id));

    return {
      ...project,
      tags: Array.isArray(project.tags) ? project.tags : [],
      image_path: project.image_path ?? null,
      image_alt: project.image_alt ?? "",
      image_url: project.image_path
        ? supabase.storage.from(BUCKET_NAME).getPublicUrl(project.image_path).data.publicUrl
        : null,
      skill_ids: skillIds,
      skills: linkedSkills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        icon_path: skill.icon_path,
        icon_url: skill.icon_url,
      })),
    };
  }) as Project[];

  return { projects, categories };
}

async function prepareProjectImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("The project image must be an image file.");
  if (file.size <= MAX_IMAGE_SIZE) return file;

  const compressed = await imageCompression(file, {
    maxSizeMB: 1.9,
    maxWidthOrHeight: 1600,
    useWebWorker: false,
    fileType: "image/webp",
    initialQuality: 0.86,
  });
  if (compressed.size > MAX_IMAGE_SIZE) throw new Error("The image could not be compressed below 2MB.");
  return new File([compressed], file.name.replace(/\.[^/.]+$/, ".webp"), { type: "image/webp" });
}

export default function AdminProjectsPage() {
  const [supabase] = useState(createClient);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allSkills = useMemo(() => categories.flatMap((category) => category.skills), [categories]);
  const filteredCategories = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();
    if (!query) return categories;
    return categories
      .map((category) => ({
        ...category,
        skills: category.skills.filter((skill) => skill.name.toLowerCase().includes(query)),
      }))
      .filter((category) => category.skills.length > 0);
  }, [categories, skillSearch]);

  async function refresh() {
    const data = await loadCmsData(supabase);
    setProjects(data.projects);
    setCategories(data.categories);
  }

  useEffect(() => {
    let cancelled = false;
    loadCmsData(supabase)
      .then((data) => {
        if (!cancelled) {
          setProjects(data.projects);
          setCategories(data.categories);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Failed to load projects.");
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setSelectedSkillIds([]);
    setSkillSearch("");
    setImageFile(null);
    setRemoveImage(false);
    setEditingProject(null);
  }

  function startEdit(project: Project) {
    setEditingProject(project);
    setForm({
      title: project.title,
      org: project.org,
      description: project.description,
      link: project.link,
      sort_order: project.sort_order,
      image_alt: project.image_alt,
    });
    setSelectedSkillIds(project.skill_ids);
    setImageFile(null);
    setRemoveImage(false);
    clearMessages();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSkill(id: string) {
    setSelectedSkillIds((current) =>
      current.includes(id) ? current.filter((skillId) => skillId !== id) : [...current, id],
    );
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      let uploadFile: File | null = null;
      if (imageFile) {
        uploadFile = await prepareProjectImage(imageFile);
      }

      const tags = allSkills.filter((skill) => selectedSkillIds.includes(skill.id)).map((skill) => skill.name);
      const actionData = new FormData();
      actionData.set("id", editingProject?.id ?? "");
      actionData.set("title", form.title);
      actionData.set("org", form.org);
      actionData.set("description", form.description);
      actionData.set("link", form.link);
      actionData.set("sortOrder", String(form.sort_order));
      actionData.set("imageAlt", form.image_alt);
      actionData.set("removeImage", String(removeImage));
      actionData.set("skillIds", JSON.stringify(selectedSkillIds));
      actionData.set("tags", JSON.stringify(tags));
      if (uploadFile) actionData.set("image", uploadFile);
      await saveProjectAction(actionData);

      setSuccess(editingProject ? "Project updated." : "Project added.");
      resetForm();
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to save project.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete ${project.title}?`)) return;
    setLoading(true);
    clearMessages();

    try {
      await deleteProjectAction(project.id);
      if (editingProject?.id === project.id) resetForm();
      setSuccess("Project deleted.");
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to delete project.");
    }
    setLoading(false);
  }

  const fieldClass = "w-full border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400";
  const buttonClass = "inline-flex items-center justify-center gap-1.5 border border-gray-300 bg-white/60 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:bg-white disabled:opacity-40";

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            Admin
          </Link>

          <div className="mt-6 mb-8 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">Project details, images, ordering, and shared skills</p>
          </div>

          <form onSubmit={saveProject} className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-8">
            <h2 className="text-sm font-medium text-gray-800">{editingProject ? "Edit project" : "Add project"}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-gray-500">Title
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={`mt-1 ${fieldClass}`} />
              </label>
              <label className="text-xs text-gray-500">Organisation
                <input required value={form.org} onChange={(event) => setForm({ ...form, org: event.target.value })} className={`mt-1 ${fieldClass}`} />
              </label>
            </div>
            <label className="text-xs text-gray-500">Description
              <textarea required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`mt-1 resize-y ${fieldClass}`} />
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <label className="text-xs text-gray-500">Project URL
                <input required type="url" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} className={`mt-1 ${fieldClass}`} />
              </label>
              <label className="text-xs text-gray-500">Display order
                <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} className={`mt-1 ${fieldClass}`} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-gray-500">Square project image (max 2MB after compression)
                <input type="file" accept="image/*" onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setRemoveImage(false); }} className={`mt-1 ${fieldClass}`} />
              </label>
              <label className="text-xs text-gray-500">Image description
                <input value={form.image_alt} onChange={(event) => setForm({ ...form, image_alt: event.target.value })} placeholder="Chess board during a match" className={`mt-1 ${fieldClass}`} />
              </label>
            </div>
            {editingProject?.image_url && !removeImage && !imageFile && (
              <div className="flex items-center gap-3">
                <Image src={editingProject.image_url} alt="" width={64} height={64} className="h-16 w-16 border border-gray-200 object-cover" />
                <button type="button" onClick={() => setRemoveImage(true)} className="text-xs text-gray-400 hover:text-red-500">Remove current image</button>
              </div>
            )}

            <fieldset className="border border-gray-200 p-3">
              <legend className="px-1 text-xs text-gray-500">Skills</legend>
              <div className="relative mb-3">
                <PhosphorIcon name="magnifying-glass" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={skillSearch} onChange={(event) => setSkillSearch(event.target.value)} placeholder="Find a skill" className={`${fieldClass} pl-9`} />
              </div>
              <div className="max-h-56 space-y-3 overflow-y-auto">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="grid grid-cols-[100px_1fr] gap-3">
                    <span className="text-xs text-gray-400">{category.name}</span>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill) => {
                        const checked = selectedSkillIds.includes(skill.id);
                        return (
                          <label key={skill.id} className={`flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-xs ${checked ? "border-mauve-500 bg-mauve-200 text-mauve-500" : "border-gray-200 text-gray-600"}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleSkill(skill.id)} className="sr-only" />
                            {skill.icon_url && <Image src={skill.icon_url} alt="" width={14} height={14} unoptimized className="h-3.5 w-3.5 object-contain" />}
                            {skill.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {allSkills.length === 0 && <p className="text-sm text-gray-400">Add skills in the Skills editor first.</p>}
                {allSkills.length > 0 && filteredCategories.length === 0 && <p className="text-sm text-gray-400">No matching skills.</p>}
              </div>
            </fieldset>

            <div aria-live="polite" className="min-h-4 text-xs">
              {error && <p className="text-red-500">{error}</p>}
              {success && <p className="text-green-600">{success}</p>}
            </div>
            <div className="flex gap-2">
              <button disabled={loading} className={buttonClass}>{loading ? "Saving..." : editingProject ? "Update project" : "Add project"}</button>
              {editingProject && <button type="button" onClick={resetForm} className={buttonClass}>Cancel</button>}
            </div>
          </form>

          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {projects.length === 0 && <p className="py-5 text-sm text-gray-500">No projects yet.</p>}
            {projects.map((project) => (
              <article key={project.id} className="flex gap-4 py-5">
                {project.image_url ? (
                  <Image src={project.image_url} alt="" width={80} height={80} className="h-20 w-20 shrink-0 border border-gray-200 object-cover" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-dashed border-gray-300 text-gray-300">
                    <PhosphorIcon name="folder-simple-star" size={22} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-medium text-gray-900">{project.title}</h2>
                    <span className="text-xs text-gray-500">{project.org}</span>
                    <span className="text-xs text-gray-400">Order {project.sort_order}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(project.skills.length > 0 ? project.skills.map((skill) => skill.name) : project.tags).map((name) => (
                      <span key={name} className="border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500">{name}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => startEdit(project)} aria-label={`Edit ${project.title}`} className="text-gray-400 hover:text-gray-700"><PhosphorIcon name="pencil-simple" size={15} /></button>
                  <button type="button" onClick={() => deleteProject(project)} aria-label={`Delete ${project.title}`} className="text-gray-400 hover:text-red-500"><PhosphorIcon name="trash" size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
