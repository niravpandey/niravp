import Link from "next/link";
import { Home } from "lucide-react";

export default function Navbar() {
  return (
    <div className="w-full bg-linear-to-r from-mauve-500 to-mauve-800 text-white text-xl py-1 px-4 sm:px-8 lg:px-16">
      <Link
        href="/"
        className="flex items-center gap-2 w-fit transition-opacity hover:opacity-80"
      >
        <span className="font-medium tracking-wide">
          Nirav Pandey
        </span>
      </Link>
    </div>
  );
}