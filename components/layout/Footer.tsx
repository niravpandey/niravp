import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full shrink-0">
      <div className="w-full bg-mauve-800 border-t border-gray-300 text-white">
        <div className="mx-auto flex items-center justify-between px-4 py-3 text-sm sm:px-8 lg:px-16">
          <span className="text-white/80">© 2026 Nirav Pandey</span>

          <Link
            href="https://github.com/niravpandey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            <span className="text-white/80">Source at </span>
            <img
              src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/icons/GitHub.png"
              alt="GitHub"
              className="h-4 w-4 rounded-full bg-white p-px"
            />

            <span>GitHub</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}