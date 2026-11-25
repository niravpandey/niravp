import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents, mdxOptions } from "@/components/blog/mdxComponents";
import Footer from "@/components/layout/Footer";
import { mathEnvironments } from "@/components/notes/MathEnvironments";
import { getPublishedNote, getPublishedNotes, getTopicSiblings, UNSORTED } from "@/lib/notes";
import { formatDate } from "@/lib/utils";

const noteComponents = { ...mdxComponents, ...mathEnvironments };

/** Prerender every published note at build; notes published later render on first visit, then stay cached. */
export async function generateStaticParams() {
  const notes = await getPublishedNotes();
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata(props: PageProps<"/notes/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const note = await getPublishedNote(slug);

  if (!note) return { title: "Note not found | Nirav Pandey" };

  return {
    title: `${note.title} | Nirav Pandey`,
    description: note.description ?? `Notes on ${note.topic ?? note.subject ?? "what I have learnt"}`,
  };
}

export default async function NotePage(props: PageProps<"/notes/[slug]">) {
  const { slug } = await props.params;
  const note = await getPublishedNote(slug);

  if (!note) notFound();

  const siblings = await getTopicSiblings(note);
  const index = siblings.findIndex((sibling) => sibling.id === note.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
  const subject = note.subject?.trim() || UNSORTED;
  const topic = note.topic?.trim() || UNSORTED;
  const revised = note.updated_at && formatDate(note.updated_at, "long");

  return (
    <div className="flex flex-1 flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-8 sm:py-24 lg:px-16">
        <article className="mx-auto w-full max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <Link href="/notes" className="transition-colors hover:text-gray-800">
              notes
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span>{subject}</span>
            <span className="mx-2 text-gray-300">/</span>
            <span>{topic}</span>
          </nav>

          <div className="mt-6 border border-line bg-white px-5 py-8 font-cm text-gray-900 sm:mt-8 sm:px-12 sm:py-10">
            {/* Title block in the manner of \maketitle. */}
            <header className="text-center">
              <h1 className="text-2xl leading-tight sm:text-[1.75rem]">{note.title}</h1>
              <p className="mt-4 text-base text-gray-600">
                {topic}
                {siblings.length > 1 && index >= 0 && `, ${index + 1} of ${siblings.length}`}
              </p>
              {revised && <p className="mt-1 text-base text-gray-600">Last revised {revised}</p>}
              {note.description && (
                <p className="mx-auto mt-6 max-w-xl text-left text-base leading-relaxed">
                  <span className="font-bold">Abstract.</span> {note.description}
                </p>
              )}
            </header>

            <div className="notes-body prose prose-gray mt-8 max-w-none break-words font-cm prose-headings:scroll-mt-24 prose-headings:font-cm prose-headings:font-bold prose-headings:text-gray-900 prose-a:no-underline prose-headings:mt-7 prose-headings:mb-2 prose-p:my-3 prose-p:leading-relaxed prose-ul:my-3 prose-ol:my-3 prose-li:my-0.5 prose-li:leading-relaxed prose-code:before:content-none prose-code:after:content-none prose-pre:my-6 prose-pre:rounded-none prose-pre:bg-transparent prose-img:my-8 prose-img:rounded-none">
              <MDXRemote source={note.content ?? ""} options={mdxOptions} components={noteComponents} />
            </div>
          </div>

          {(previous || next) && (
            <nav aria-label={`More in ${topic}`} className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <div>
                {previous && (
                  <Link href={`/notes/${previous.slug}`} className="group block">
                    <span className="text-gray-500">Previous</span>
                    <span className="block text-blue-900 underline decoration-gray-300 underline-offset-4 group-hover:decoration-blue-900">
                      {previous.title}
                    </span>
                  </Link>
                )}
              </div>
              <div className="text-right">
                {next && (
                  <Link href={`/notes/${next.slug}`} className="group block">
                    <span className="text-gray-500">Next</span>
                    <span className="block text-blue-900 underline decoration-gray-300 underline-offset-4 group-hover:decoration-blue-900">
                      {next.title}
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
