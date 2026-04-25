import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { Book, BookStatus } from "@/lib/books";

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "Currently reading",
  queued: "Want to read",
  finished: "Finished",
};

type ReadingSectionProps = {
  books?: Book[];
};

export default function ReadingSection({
  books = [],
}: ReadingSectionProps) {
  if (books.length === 0) return null;

  const grouped: Record<BookStatus, Book[]> = {
    reading: books.filter((book) => book.status === "reading"),
    queued: books.filter((book) => book.status === "queued"),
    finished: books.filter((book) => book.status === "finished"),
  };

  return (
    <section className="w-full pt-4">
      <h1 className="flex items-center gap-2 pb-3 text-3xl font-semibold text-blue-900">
        <PhosphorIcon name="bookmark-simple" size={28} className="text-mauve-500" />
        Reading
      </h1>

      <div className="flex flex-col gap-6">
        {(Object.keys(grouped) as BookStatus[]).map((status) => {
          const items = grouped[status];
          if (items.length === 0) return null;

          return (
            <div key={status}>
              <p className="pb-1 text-xs uppercase  text-mauve-500">
                {STATUS_LABELS[status]}
              </p>

              <div className="flex flex-col">
                {items.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <div className="flex min-w-0 flex-1 items-baseline gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {book.title}
                      </p>
                      <p className="shrink truncate text-xs text-gray-400">
                        {book.author}
                      </p>
                    </div>

                    {book.status === "reading" && (
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="h-0.5 w-14 bg-gray-200">
                          <div
                            className="h-full bg-mauve-500"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs text-gray-400">
                          {book.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
