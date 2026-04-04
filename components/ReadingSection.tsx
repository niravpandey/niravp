import Link from "next/link";
 
type Book = {
  id: string;
  title: string;
  author: string;
  progress: number;
  color: string;
};
 
export default function ReadingSection({ books = [] }: { books: Book[] }) {
  if (books.length === 0) return null;
 
  return (
    <div className="w-full pt-4 border-b border-gray-200 pb-5">
      <h1 className="text-3xl text-mauve-500 font-semibold pb-4">Currently Reading</h1>
      <div className="flex flex-col gap-3">
        {books.map((book) => (
          <div key={book.id} className="flex items-start gap-3">
            <div
              className="w-1.5 shrink-0 rounded-sm mt-1"
              style={{ background: book.color, height: "2.5rem" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{book.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
              <div className="mt-2 h-0.5 w-full bg-gray-200">
                <div
                  className="h-full"
                  style={{ width: `${book.progress}%`, background: book.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link href="/reading" className="mt-4 inline-block text-xs text-gray-400 hover:text-gray-600 transition-colors">
        All books →
      </Link>
    </div>
  );
}
 