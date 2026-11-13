import Link from "next/link";
import CommandPalette from "@/components/layout/CommandPalette";
import { getSearchablePosts } from "@/lib/blog";

export default async function Navbar() {
  const posts = await getSearchablePosts();

  return (
    <nav className="relative z-30 flex print:hidden w-full items-center justify-between gap-3 bg-palette-gradient px-4 py-2 text-lg sm:gap-4 sm:text-xl text-white sm:px-8 lg:px-16">
      <Link href="/" className="shrink-0 whitespace-nowrap font-serif font-heading tracking-heading transition-opacity hover:opacity-80">
        Nirav Pandey
      </Link>
      <div className="flex items-center gap-3 sm:gap-5">
        <CommandPalette posts={posts} />
        <Link href="/blog" className="text-sm font-bold transition-opacity hover:opacity-80">
          Blog
        </Link>
        <Link href="/design" className="text-sm font-bold transition-opacity hover:opacity-80">
          Design
        </Link>
      </div>
    </nav>
  );
}
