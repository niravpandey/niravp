"use client";

import { useEffect, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Loader2 } from "lucide-react";

type Book = {
  title: string;
  author: string;
  link: string;
  cover_image: string | null;
};

export default function CurrentlyReading() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch("/api/books");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Book[] = await res.json();
        setBooks(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load books");
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (error) return <p className="text-red-500">{error}</p>;
  if (!books.length) return <p>No books currently reading.</p>;

  return (
    <section className="w-full mt-6">
      {/* Container centers content and constrains width for readability */}
      <div className="mx-auto max-w-6xl px-4">
        {/* Using CSS Grid makes the layout fluid and predictable */}
        <div
          className="
            grid
            gap-6
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            xl:grid-cols-6
            items-start
          "
        >
          {books.map((book, i) => (
            <HoverCard key={book.link || i} openDelay={50} closeDelay={50}>
              {/* Use a button for keyboard accessibility as the trigger */}
              <HoverCardTrigger asChild>
                <button
                  aria-label={`Open details for ${book.title}`}
                  className="group relative w-full"
                >
                  {/* Aspect ratio keeps all covers consistent */}
                  <div
                    className="
                      relative
                      w-full
                      aspect-3/4
                      rounded-lg
                      overflow-hidden
                      shadow-sm
                      group-hover:shadow-md
                      transition-shadow
                      duration-150
                    "
                  >
                    <img
                      src={book.cover_image || "/placeholder.png"}
                      alt={book.title}
                      sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 160px"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                      className="rounded-lg"
                    />
                  </div>
                </button>
              </HoverCardTrigger>

              <HoverCardContent className="w-64 p-3">
                <h3 className="font-semibold text-sm line-clamp-3">{book.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {book.author}
                </p>
                <a
                  href={book.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-2 inline-block underline-offset-2 hover:underline text-blue-600 dark:text-blue-400"
                >
                  View on Goodreads
                </a>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}
