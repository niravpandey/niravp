import Link from "next/link";
import CommandPalette from "@/components/layout/CommandPalette";
import NavbarNewsletter from "@/components/layout/NavbarNewsletter";
import { getSearchablePosts } from "@/lib/blog";

export default async function Navbar() {
  const posts = await getSearchablePosts();

  return (
    <nav className="relative z-30 flex w-full items-center justify-between gap-4 bg-linear-to-r from-mauve-500 to-mauve-800 px-4 py-1 text-xl text-white sm:px-8 lg:px-16">
      <Link href="/" className="font-serif tracking-wide transition-opacity hover:opacity-80">
        Nirav Pandey
      </Link>
      <div className="flex items-center gap-5">
        <CommandPalette posts={posts} />
        <Link href="/blog" className="text-sm font-medium transition-opacity hover:opacity-80">
          Blog
        </Link>
        <NavbarNewsletter />
      </div>
    </nav>
  );
}
