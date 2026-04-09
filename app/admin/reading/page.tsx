"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

type Book = {
  id: string;
  title: string;
  author: string;
  status: "reading" | "queued" | "finished";
  progress: number;
};

const STATUS_OPTIONS = ["reading", "queued", "finished"] as const;

const EMPTY: Omit<Book, "id"> = {
  title: "",
  author: "",
  status: "queued",
  progress: 0,
};

async function listBooks(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, status, progress")
    .order("created_at", { ascending: false });

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
      setError(
        cause instanceof Error ? cause.message : "Failed to load books."
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialBooks() {
      try {
        const data = await listBooks(supabase);
        if (!cancelled) setBooks(data);
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load books."
          );
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
    setForm({
      title: book.title,
      author: book.author,
      status: book.status,
      progress: book.progress,
    });
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
      const { error } = await supabase
        .from("books")
        .update(form)
        .eq("id", editingId);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("books").insert(form);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
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
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-8 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">
              Reading list
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Keep the public reading page aligned with what you are actually
              reading.
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="mb-10 flex flex-col gap-3 border border-gray-200 bg-white/60 p-4 sm:p-5"
          >
            <p className="text-sm font-medium text-gray-700">
              {editingId ? "Edit book" : "Add a book"}
            </p>

            <label htmlFor="title" className="sr-only">
              Title
            </label>
            <input
              id="title"
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              required
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm"
            />

            <label htmlFor="author" className="sr-only">
              Author
            </label>
            <input
              id="author"
              name="author"
              placeholder="Author"
              value={form.author}
              onChange={(e) =>
                setForm({ ...form, author: e.target.value })
              }
              required
              className="border border-gray-200 bg-transparent px-3 py-2 text-sm"
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="status" className="sr-only">
                  Reading status
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as Book["status"],
                    })
                  }
                  className="w-full border border-gray-200 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="progress" className="sr-only">
                  Progress percentage
                </label>
                <input
                  id="progress"
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Progress %"
                  value={form.progress}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      progress: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-28 border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                aria-label={
                  loading
                    ? "Saving book"
                    : editingId
                    ? "Update book"
                    : "Add book"
                }
                className="border px-3 py-1.5 text-sm"
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update"
                  : "Add"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  aria-label="Cancel editing"
                  className="border px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* LIST */}
          {(["reading", "queued", "finished"] as const).map(
            (status) =>
              grouped[status].length > 0 && (
                <div key={status} className="mb-8">
                  <p className="mb-3 text-xs uppercase text-gray-400">
                    {status}
                  </p>
                  <div className="flex flex-col gap-2">
                    {grouped[status].map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center border p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {book.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {book.author}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(book)}
                            aria-label={`Edit ${book.title}`}
                            className="text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(book.id)
                            }
                            aria-label={`Delete ${book.title}`}
                            className="text-xs text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
