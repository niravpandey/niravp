import Link from "next/link";

export default function Navbar() {
  return (
    <div className="flex w-full items-center justify-between bg-linear-to-r from-mauve-500 to-mauve-800 px-4 py-1 text-xl text-white sm:px-8 lg:px-16">
      <Link
        href="/"
        className="flex items-center gap-2 w-fit transition-opacity hover:opacity-80"
      >
        <span className="font-medium tracking-wide">
          Nirav Pandey
        </span>
      </Link>
      <Link
        href="/blog"
        className="text-sm font-medium transition-opacity hover:opacity-80"
      >
        Blog
      </Link>
    </div>
  );
}
