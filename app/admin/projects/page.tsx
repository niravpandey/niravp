"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/projects";

type ProjectForm = {
  title: string;
  org: string;
  description: string;
  tags: string;
  link: string;
  sort_order: number;
};

const EMPTY_FORM: ProjectForm = {
  title: "",
  org: "",
  description: "",
  tags: "",
  link: "",
  sort_order: 0,
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatTags(tags: string[]) {
  return tags.join(", ");
}

async function listProjects(supabase: ReturnType<typeof createClient>) {
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
  })) as Project[];
}

export default function AdminProjectsPage() {
  const [supabase] = useState(createClient);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshProjects() {
    try {
      setProjects(await listProjects(supabase));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to load projects.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialProjects() {
      try {
        const data = await listProjects(supabase);
        if (!cancelled) {
          setProjects(data);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load projects.");
        }
      }
    }

    void loadInitialProjects();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      org: project.org,
      description: project.description,
      tags: formatTags(project.tags),
      link: project.link,
      sort_order: project.sort_order,
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      org: form.org.trim(),
      description: form.description.trim(),
      tags: parseTags(form.tags),
      link: form.link.trim(),
      sort_order: form.sort_order,
    };

    const query = editingId
      ? supabase.from("projects").update(payload).eq("id", editingId)
      : supabase.from("projects").insert(payload);

    const { error: mutationError } = await query;
    if (mutationError) {
      setError(mutationError.message);
      setLoading(false);
      return;
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    setLoading(false);
    await refreshProjects();
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError("");

    const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    if (editingId === id) {
      cancelEdit();
    }

    setLoading(false);
    await refreshProjects();
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center  px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-8 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">Create, edit, and order the projects shown on the home page.</p>
          </div>

          <form onSubmit={handleSubmit} className="mb-10 flex flex-col gap-3 border border-gray-200 bg-white/60 p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-700">{editingId ? "Edit project" : "Add a project"}</p>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
            />
            <input
              placeholder="Organisation"
              value={form.org}
              onChange={(event) => setForm({ ...form, org: event.target.value })}
              required
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
              rows={4}
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
              <input
                placeholder="Tags, comma separated"
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Order"
                value={form.sort_order}
                onChange={(event) => setForm({ ...form, sort_order: Number.parseInt(event.target.value, 10) || 0 })}
                className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
              />
            </div>
            <input
              type="url"
              placeholder="https://example.com"
              value={form.link}
              onChange={(event) => setForm({ ...form, link: event.target.value })}
              required
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-40"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-col gap-3">
            {projects.length === 0 ? (
              <div className="border border-gray-200 bg-white/60 p-4 text-sm text-gray-500">No projects yet.</div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 bg-white/60 p-4 transition-colors hover:border-gray-300"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-medium text-gray-900">{project.title}</p>
                        <span className="text-xs text-gray-500">{project.org}</span>
                        <span className="text-xs text-gray-400">Order {project.sort_order}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span key={tag} className="border border-gray-300 px-2 py-0.5 text-xs text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
                      >
                        <span className="truncate">{project.link}</span>
                        <PhosphorIcon name="arrow-square-out" size={14} />
                      </a>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        className="text-xs text-gray-400 transition-colors hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
