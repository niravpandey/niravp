"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";
import type { Experience } from "@/lib/experience";
import { deleteExperienceAction, saveExperienceAction } from "@/app/admin/portfolio-actions";

type ExperienceForm = {
  title: string;
  subtitle: string;
  organization: string;
  date_range: string;
  description: string;
  sort_order: number;
};

const EMPTY_FORM: ExperienceForm = { title: "", subtitle: "", organization: "", date_range: "", description: "", sort_order: 0 };

async function loadExperiences(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("experiences")
    .select("id, title, subtitle, organization, date_range, description, logo_path, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    ...item,
    logo_path: item.logo_path ?? null,
    logo_url: item.logo_path ? supabase.storage.from("Assets").getPublicUrl(item.logo_path).data.publicUrl : null,
  })) as Experience[];
}

export default function AdminExperiencePage() {
  const [supabase] = useState(createClient);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [form, setForm] = useState<ExperienceForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() { setExperiences(await loadExperiences(supabase)); }

  useEffect(() => {
    loadExperiences(supabase).then(setExperiences).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Failed to load experience."));
  }, [supabase]);

  function reset() { setForm(EMPTY_FORM); setEditing(null); setLogoFile(null); setRemoveLogo(false); }

  function startEdit(item: Experience) {
    setEditing(item);
    setForm({ title: item.title, subtitle: item.subtitle, organization: item.organization, date_range: item.date_range, description: item.description, sort_order: item.sort_order });
    setLogoFile(null); setRemoveLogo(false);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const data = new FormData();
      data.set("id", editing?.id ?? ""); data.set("title", form.title); data.set("subtitle", form.subtitle);
      data.set("organization", form.organization); data.set("dateRange", form.date_range); data.set("description", form.description);
      data.set("sortOrder", String(form.sort_order)); data.set("removeLogo", String(removeLogo));
      if (logoFile) data.set("logo", logoFile);
      await saveExperienceAction(data); setMessage(editing ? "Experience updated." : "Experience added."); reset(); await refresh();
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Could not save experience."); }
    finally { setLoading(false); }
  }

  async function remove(item: Experience) {
    if (!confirm(`Delete ${item.title}?`)) return;
    setLoading(true); setMessage("");
    try { await deleteExperienceAction(item.id); setMessage("Experience deleted."); if (editing?.id === item.id) reset(); await refresh(); }
    catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Could not delete experience."); }
    finally { setLoading(false); }
  }

  const field = "mt-1 w-full border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none";

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><PhosphorIcon name="arrow-left" size={16} />Admin</Link>
          <div className="mt-6 mb-8 border-b border-gray-200 pb-5"><h1 className="text-3xl font-semibold text-mauve-500">Experience</h1><p className="mt-1 text-sm text-gray-500">Roles, organisations, dates, descriptions, and logos</p></div>
          {message && <p className="mb-4 border border-gray-200 bg-white/60 px-3 py-2 text-sm text-gray-600">{message}</p>}
          <form onSubmit={save} className="mb-10 grid gap-4 border-b border-gray-200 pb-8">
            <h2 className="text-sm font-medium text-gray-800">{editing ? "Edit experience" : "Add experience"}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-gray-500">Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} /></label>
              <label className="text-xs text-gray-500">Organisation<input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className={field} /></label>
              <label className="text-xs text-gray-500">Subtitle<input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={field} placeholder="Part-time · Research" /></label>
              <label className="text-xs text-gray-500">Date range<input value={form.date_range} onChange={(e) => setForm({ ...form, date_range: e.target.value })} className={field} placeholder="2025 — present" /></label>
              <label className="text-xs text-gray-500">Display order<input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} className={field} /></label>
              <label className="text-xs text-gray-500">Logo image<input type="file" accept="image/*" onChange={(e) => { setLogoFile(e.target.files?.[0] ?? null); setRemoveLogo(false); }} className={field} /></label>
            </div>
            <label className="text-xs text-gray-500">Description<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${field} resize-y`} /></label>
            {editing?.logo_url && !removeLogo && !logoFile && <Image src={editing.logo_url} alt="Current logo" width={48} height={48} className="h-12 w-12 object-contain" />}
            {editing && <label className="flex items-center gap-2 text-xs text-gray-500"><input type="checkbox" checked={removeLogo} onChange={(e) => setRemoveLogo(e.target.checked)} />Remove current logo</label>}
            <div className="flex gap-2"><button disabled={loading} className="border border-gray-300 bg-white/60 px-3 py-2 text-sm text-gray-700 disabled:opacity-40">{loading ? "Saving..." : editing ? "Update experience" : "Add experience"}</button>{editing && <button type="button" onClick={reset} className="border border-gray-300 px-3 py-2 text-sm text-gray-600">Cancel</button>}</div>
          </form>
          <div className="grid gap-4">{experiences.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center">{item.logo_url ? <Image src={item.logo_url} alt="" width={40} height={40} className="h-full w-full object-contain" /> : <PhosphorIcon name="book-open" size={18} className="text-mauve-500" />}</div><div><h2 className="font-medium text-gray-900">{item.title}</h2><p className="text-sm text-mauve-500">{[item.organization, item.subtitle].filter(Boolean).join(" · ")}</p><p className="text-xs text-gray-400">{item.date_range}</p></div></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => startEdit(item)} className="text-xs text-gray-600 hover:text-gray-900">Edit</button><button type="button" onClick={() => void remove(item)} disabled={loading} className="text-xs text-red-600 disabled:opacity-40">Delete</button></div></article>)}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
