import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { getPublishedNotes, groupNotes } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Notes | Nirav Pandey",
  description: "Notes and proofs on what I have been learning.",
};

function anchorId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function NotesIndexPage() {
  const subjects = groupNotes(await getPublishedNotes());

  return (
    <div className="flex flex-1 flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto w-full max-w-3xl">
          {/* The page header, written as a dictionary entry for "notes", like the blog's. */}
          <header className="border-b border-line pb-8">
            <h1 className="font-serif text-4xl font-heading leading-none tracking-heading text-heading sm:text-5xl">notes</h1>
            <p className="mt-3 text-gray-600">
              <span className="font-serif italic">noun, plural</span>
              <span className="mx-2 text-gray-400">|</span>
              <span>\ˈnōts\</span>
            </p>
            <div className="mt-4 flex max-w-2xl gap-3 text-gray-700">
              <span className="font-bold text-heading">1</span>
              <p>pieces of paper money</p>
            </div>
          </header>

          {subjects.length === 0 ? (
            <p className="mt-10 text-sm text-gray-500">No notes yet.</p>
          ) : (
            <>
              {subjects.length > 1 && (
                <nav aria-label="Subjects" className="mt-8 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {subjects.map((subject) => (
                    <a
                      key={subject.name}
                      href={`#${anchorId(subject.name)}`}
                      className="text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900"
                    >
                      {subject.name}
                    </a>
                  ))}
                </nav>
              )}

              <div className="mt-10 space-y-14">
                {subjects.map((subject) => (
                  <section key={subject.name} id={anchorId(subject.name)} className="scroll-mt-24">
                    <h2 className="border-b border-line pb-2 font-serif text-2xl font-heading tracking-heading text-heading">
                      {subject.name}
                    </h2>

                    <div className="mt-6 space-y-8">
                      {subject.topics.map((topic) => (
                        <div key={topic.name}>
                          <h3 className="flex items-baseline justify-between gap-4 text-base font-bold text-gray-900">
                            <span>{topic.name}</span>
                            <span className="shrink-0 text-xs font-normal text-gray-500">
                              {topic.notes.length} {topic.notes.length === 1 ? "note" : "notes"}
                            </span>
                          </h3>
                          <ol className="mt-3 space-y-2">
                            {topic.notes.map((note, index) => (
                              <li key={note.id} className="flex gap-3">
                                <span className="w-6 shrink-0 text-right text-sm text-gray-400">{index + 1}.</span>
                                <div className="min-w-0">
                                  <Link
                                    href={`/notes/${note.slug}`}
                                    className="text-blue-900 underline decoration-gray-300 underline-offset-4 transition-colors hover:decoration-blue-900"
                                  >
                                    {note.title}
                                  </Link>
                                  {note.description && <p className="mt-0.5 text-sm text-gray-500">{note.description}</p>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
