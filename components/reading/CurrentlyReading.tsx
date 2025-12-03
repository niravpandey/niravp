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
    <div className="flex justify-center ">
      <div className="flex flex-col md:flex-row md:flex-wrap md:justify-center gap-6 mt-6">
        {books.map((book, index) => (
          <HoverCard key={book.link || index} openDelay={50} closeDelay={50}>
            <HoverCardTrigger>
              <img
                src={book.cover_image || "/placeholder.png"}
                alt={book.title}
                className="
                  w-40 h-64 sm:w-48 sm:h-72 md:w-52 md:h-80 lg:w-60 lg:h-96
                  object-contain cursor-pointer
                  shadow-sm hover:shadow-md transition-shadow duration-150
                "
              />
            </HoverCardTrigger>
            <HoverCardContent className="w-60 p-3">
              <h3 className="font-semibold text-sm line-clamp-3">{book.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {book.author}
              </p>
              <a
                href={book.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 block"
              >
                View on Goodreads
              </a>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    </div>
  );
}
