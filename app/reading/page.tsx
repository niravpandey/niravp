import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";

type Book = {
  id: string;
  title: string;
  author: string;
  status: "reading" | "queued" | "finished";
  progress: number;
  color: string;
};

export default async function ReadingPage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  const grouped = {
    reading: (books ?? []).filter((b) => b.status === "reading"),
    queued: (books ?? []).filter((b) => b.status === "queued"),
    finished: (books ?? []).filter((b) => b.status === "finished"),
  };

  return (
    <div className="flex flex-col flex-1 font-sans">
      <main className="flex flex-1 flex-col items-center py-16 sm:py-32 px-4 sm:px-8 lg:px-16 bg-olive-100 w-full sm:items-start">
        <div className="w-full max-w-4xl">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="pb-1 text-3xl font-semibold text-mauve-500">Reading</h1>
            <p className="text-sm text-gray-500">Books I&apos;m reading, want to read, and have finished.</p>
          </div>

          {(["reading", "queued", "finished"] as const).map((status) =>
            grouped[status].length > 0 ? (
              <div key={status} className="mb-10 mt-8 w-full">
                <p className="mb-4 text-xs uppercase tracking-widest text-gray-400">{status}</p>
                <div className="flex flex-col gap-3">
                  {grouped[status].map((book: Book) => (
                    <div key={book.id} className="flex items-start gap-3 border border-gray-200 bg-white/50 p-3">
                      <div
                        className="mt-1 w-1.5 shrink-0 rounded-sm"
                        style={{ background: book.color, height: book.status === "reading" ? "2.5rem" : "1.5rem" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{book.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{book.author}</p>
                        {book.status === "reading" && (
                          <div className="mt-2 h-0.5 w-full bg-gray-200">
                            <div
                              className="h-full"
                              style={{ width: `${book.progress}%`, background: book.color }}
                            />
                          </div>
                        )}
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
