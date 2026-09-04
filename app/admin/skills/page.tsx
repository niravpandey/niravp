"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";
import type { Skill, SkillCategory } from "@/lib/skills";
import {
  deleteSkillAction,
  deleteSkillCategoryAction,
  saveSkillAction,
  saveSkillCategoryAction,
} from "@/app/admin/portfolio-actions";

const BUCKET_NAME = "Assets";

type CategoryForm = { name: string; sort_order: number };
type SkillForm = { name: string; category_id: string; sort_order: number };

const EMPTY_CATEGORY: CategoryForm = { name: "", sort_order: 0 };
const EMPTY_SKILL: SkillForm = { name: "", category_id: "", sort_order: 0 };

async function loadSkillCategories(supabase: ReturnType<typeof createClient>) {
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
        icon_url: skill.icon_path
          ? supabase.storage.from(BUCKET_NAME).getPublicUrl(skill.icon_path).data.publicUrl
          : null,
      })),
  })) as SkillCategory[];
}

export default function AdminSkillsPage() {
  const [supabase] = useState(createClient);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [skillForm, setSkillForm] = useState<SkillForm>(EMPTY_SKILL);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [removeIcon, setRemoveIcon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const skillCount = useMemo(
    () => categories.reduce((total, category) => total + category.skills.length, 0),
    [categories],
  );

  async function refresh() {
    const nextCategories = await loadSkillCategories(supabase);
    setCategories(nextCategories);
    setSkillForm((current) => ({
      ...current,
      category_id: current.category_id || nextCategories[0]?.id || "",
    }));
  }

  useEffect(() => {
    let cancelled = false;
    loadSkillCategories(supabase)
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        setSkillForm((current) => ({ ...current, category_id: data[0]?.id || "" }));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Failed to load skills.");
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY);
  }

  function cancelSkillEdit() {
    setEditingSkill(null);
    setSkillForm({ ...EMPTY_SKILL, category_id: categories[0]?.id || "" });
    setIconFile(null);
    setRemoveIcon(false);
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      await saveSkillCategoryAction({
        id: editingCategoryId,
        name: categoryForm.name,
        sortOrder: categoryForm.sort_order,
      });
      setSuccess(editingCategoryId ? "Category updated." : "Category added.");
      cancelCategoryEdit();
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to save category.");
    }
    setLoading(false);
  }

  async function deleteCategory(category: SkillCategory) {
    if (!window.confirm(`Delete ${category.name} and all ${category.skills.length} skills in it?`)) return;
    setLoading(true);
    clearMessages();

    try {
      await deleteSkillCategoryAction(category.id);
      setSuccess("Category and its skills deleted.");
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to delete category.");
    }
    setLoading(false);
  }

  async function saveSkill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const actionData = new FormData();
      actionData.set("id", editingSkill?.id ?? "");
      actionData.set("name", skillForm.name);
      actionData.set("categoryId", skillForm.category_id);
      actionData.set("sortOrder", String(skillForm.sort_order));
      actionData.set("removeIcon", String(removeIcon));
      if (iconFile) actionData.set("icon", iconFile);
      await saveSkillAction(actionData);

      setSuccess(editingSkill ? "Skill updated." : "Skill added.");
      cancelSkillEdit();
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to save skill.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSkill(skill: Skill) {
    if (!window.confirm(`Delete ${skill.name}? It will also be removed from every project.`)) return;
    setLoading(true);
    clearMessages();

    try {
      await deleteSkillAction(skill.id);
      setSuccess("Skill deleted.");
      if (editingSkill?.id === skill.id) cancelSkillEdit();
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to delete skill.");
    }
    setLoading(false);
  }

  function startCategoryEdit(category: SkillCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, sort_order: category.sort_order });
    clearMessages();
  }

  function startSkillEdit(skill: Skill) {
    setEditingSkill(skill);
    setSkillForm({ name: skill.name, category_id: skill.category_id, sort_order: skill.sort_order });
    setIconFile(null);
    setRemoveIcon(false);
    clearMessages();
  }

  const fieldClass = "border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400";
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
            <h1 className="text-3xl font-semibold text-mauve-500">Skills</h1>
            <p className="mt-1 text-sm text-gray-500">{skillCount} skills across {categories.length} categories</p>
          </div>

          <section className="grid gap-6 border-b border-gray-200 pb-8 md:grid-cols-2">
            <form onSubmit={saveCategory} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-gray-800">{editingCategoryId ? "Edit category" : "Add category"}</h2>
              <label className="text-xs text-gray-500">Category name
                <input required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} className={`mt-1 w-full ${fieldClass}`} />
              </label>
              <label className="text-xs text-gray-500">Display order
                <input type="number" value={categoryForm.sort_order} onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) || 0 })} className={`mt-1 w-full ${fieldClass}`} />
              </label>
              <div className="flex gap-2">
                <button disabled={loading} className={buttonClass}>{editingCategoryId ? "Update category" : "Add category"}</button>
                {editingCategoryId && <button type="button" onClick={cancelCategoryEdit} className={buttonClass}>Cancel</button>}
              </div>
            </form>

            <form onSubmit={saveSkill} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-gray-800">{editingSkill ? "Edit skill" : "Add skill"}</h2>
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <label className="text-xs text-gray-500">Skill name
                  <input required value={skillForm.name} onChange={(event) => setSkillForm({ ...skillForm, name: event.target.value })} className={`mt-1 w-full ${fieldClass}`} />
                </label>
                <label className="text-xs text-gray-500">Order
                  <input type="number" value={skillForm.sort_order} onChange={(event) => setSkillForm({ ...skillForm, sort_order: Number(event.target.value) || 0 })} className={`mt-1 w-full ${fieldClass}`} />
                </label>
              </div>
              <label className="text-xs text-gray-500">Category
                <select required value={skillForm.category_id} onChange={(event) => setSkillForm({ ...skillForm, category_id: event.target.value })} className={`mt-1 w-full ${fieldClass}`}>
                  <option value="" disabled>Choose a category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="text-xs text-gray-500">Icon (optional, max 1MB)
                <input type="file" accept="image/*" onChange={(event) => { setIconFile(event.target.files?.[0] ?? null); setRemoveIcon(false); }} className={`mt-1 w-full ${fieldClass}`} />
              </label>
              {editingSkill?.icon_url && !removeIcon && !iconFile && (
                <button type="button" onClick={() => setRemoveIcon(true)} className="w-fit text-xs text-gray-400 hover:text-red-500">Remove current icon</button>
              )}
              <div className="flex gap-2">
                <button disabled={loading || categories.length === 0} className={buttonClass}>{editingSkill ? "Update skill" : "Add skill"}</button>
                {editingSkill && <button type="button" onClick={cancelSkillEdit} className={buttonClass}>Cancel</button>}
              </div>
            </form>
          </section>

          <div aria-live="polite" className="min-h-8 py-3 text-xs">
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-600">{success}</p>}
          </div>

          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {categories.map((category) => (
              <section key={category.id} className="py-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-gray-900">{category.name}</h2>
                    <p className="text-xs text-gray-400">Order {category.sort_order}</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => startCategoryEdit(category)} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
                    <button type="button" onClick={() => deleteCategory(category)} className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.skills.length === 0 && <p className="text-sm text-gray-400">No skills in this category.</p>}
                  {category.skills.map((skill) => (
                    <div key={skill.id} className="flex h-9 items-center gap-2 border border-gray-200 bg-white/60 px-2.5">
                      {skill.icon_url ? <Image src={skill.icon_url} alt="" width={16} height={16} unoptimized className="h-4 w-4 object-contain" /> : <span className="h-4 w-4 border border-dashed border-gray-300" />}
                      <span className="text-sm text-gray-700">{skill.name}</span>
                      <button type="button" onClick={() => startSkillEdit(skill)} aria-label={`Edit ${skill.name}`} className="ml-1 text-gray-400 hover:text-gray-700"><PhosphorIcon name="pencil-simple" size={13} /></button>
                      <button type="button" onClick={() => deleteSkill(skill)} aria-label={`Delete ${skill.name}`} className="text-gray-400 hover:text-red-500"><PhosphorIcon name="trash" size={13} /></button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
