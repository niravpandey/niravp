"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Footer from "@/components/Footer";

type Book = {
  id: string;
  title: string;
  author: string;
  status: "reading" | "queued" | "finished";
  progress: number;
  color: string;
};

const STATUS_OPTIONS = ["reading", "queued", "finished"] as const;
const COLOR_OPTIONS = [
  { label: "Teal", value: "#5DCAA5" },
  { label: "Mauve", value: "#9F8FAF" },
  { label: "Amber", value: "#FAC775" },
  { label: "Blue", value: "#85B7EB" },
  { label: "Coral", value: "#F0997B" },
  { label: "Gray", value: "#B4B2A9" },
];

const EMPTY: Omit<Book, "id"> = {
  title: "",
  author: "",
  status: "queued",
  progress: 0,
  color: COLOR_OPTIONS[0].value,
};

async function listBooks(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export default function AdminReadingPage() {
  const [supabase] = useState(createClient);
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshBooks() {
    try {
      setBooks(await listBooks(supabase));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to load books.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialBooks() {
      try {
        const data = await listBooks(supabase);
        if (!cancelled) {
          setBooks(data);
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load books.");
        }
      }
    }

    void loadInitialBooks();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function startEdit(book: Book) {
    setEditingId(book.id);
    setForm({ title: book.title, author: book.author, status: book.status, progress: book.progress, color: book.color });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (editingId) {
      const { error } = await supabase.from("books").update(form).eq("id", editingId);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.from("books").insert(form);
      if (error) { setError(error.message); setLoading(false); return; }
    }

    setForm(EMPTY);
    setEditingId(null);
    setLoading(false);
    await refreshBooks();
  }

  async function handleDelete(id: string) {
    await supabase.from("books").delete().eq("id", id);
    await refreshBooks();
  }

  const grouped = {
    reading: books.filter((b) => b.status === "reading"),
    queued: books.filter((b) => b.status === "queued"),
    finished: books.filter((b) => b.status === "finished"),
  };

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center bg-olive-100 px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="text-sm text-gray-500 transition-colors hover:text-gray-800">
            ← Admin
          </Link>

          <div className="mt-6 mb-8 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">Reading list</h1>
            <p className="mt-1 text-sm text-gray-500">Keep the public reading page aligned with what you are actually reading.</p>
          </div>

          <form onSubmit={handleSubmit} className="mb-10 flex flex-col gap-3 border border-gray-200 bg-white/60 p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-700">{editingId ? "Edit book" : "Add a book"}</p>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
            />
            <input
              placeholder="Author"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
            />
            <div className="flex gap-3">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Book["status"] })}
                className="flex-1 border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Progress %"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })}
                className="w-28 border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Spine colour</span>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  style={{ background: c.value }}
                  className={`h-5 w-5 transition-transform ${form.color === c.value ? "scale-125 ring-1 ring-offset-1 ring-gray-400" : ""}`}
                />
              ))}
            </div>
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

          {(["reading", "queued", "finished"] as const).map((status) =>
            grouped[status].length > 0 ? (
              <div key={status} className="mb-8">
                <p className="mb-3 text-xs uppercase tracking-widest text-gray-400">{status}</p>
                <div className="flex flex-col gap-2">
                  {grouped[status].map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center gap-3 border border-gray-200 bg-white/60 p-3 transition-colors hover:border-gray-300"
                    >
                      <div className="w-1.5 self-stretch shrink-0 rounded-sm" style={{ background: book.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{book.title}</p>
                        <p className="text-xs text-gray-500">{book.author}</p>
                        {book.status === "reading" && (
                          <div className="mt-1.5 h-0.5 w-full bg-gray-200">
                            <div className="h-full" style={{ width: `${book.progress}%`, background: book.color }} />
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => startEdit(book)}
                          className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="text-xs text-gray-400 transition-colors hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
