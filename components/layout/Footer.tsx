import Image from "next/image";
import { getAssetUrl } from "@/lib/supabase/storage";

export default function Footer() {
  return (
    <footer className="w-full shrink-0 border-t border-gray-300 bg-mauve-800 text-white">
      <div className="mx-auto flex items-center justify-between px-4 py-3 text-sm sm:px-8 lg:px-16">
        <span className="text-white/80">© 2026 Nirav Pandey</span>

        <a
          href="https://github.com/niravpandey"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 transition-opacity hover:opacity-80"
        >
          <span className="text-white/80">Source at</span>
          <Image
            src={getAssetUrl("icons/GitHub.png")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 rounded-full bg-white p-px"
          />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
