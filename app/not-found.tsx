import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found · Nirav Pandey",
};

/** Site-wide 404: shown for unknown URLs and whenever a page calls notFound(). */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 font-sans sm:px-8 sm:py-24">
      <section className="w-full max-w-xl">
        <h1 className="font-serif text-7xl font-heading leading-none tracking-heading text-heading sm:text-8xl">404</h1>

        <div className="mt-8 border border-line bg-letter px-4 py-3 text-sm leading-6 text-gray-700">
          This page wandered off, like a random walk that never came back. It may have moved, or it never existed.
        </div>

        <p className="mt-6 flex gap-5 text-sm">
          <Link href="/" className="text-accent underline underline-offset-4 hover:opacity-80">
            Home
          </Link>
          <Link href="/blog" className="text-accent underline underline-offset-4 hover:opacity-80">
            Blog
          </Link>
          <Link href="/design" className="text-accent underline underline-offset-4 hover:opacity-80">
            Design
          </Link>
        </p>
      </section>
    </main>
  );
}
