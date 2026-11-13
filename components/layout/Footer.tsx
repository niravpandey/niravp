import Image from "next/image";
import { getAssetUrl } from "@/lib/supabase/storage";
import FooterNewsletter from "@/components/layout/FooterNewsletter";

export default function Footer() {
  return (
    <footer className="w-full shrink-0 border-t border-line bg-mauve-800 text-white">
      <div className="mx-auto flex flex-col items-start gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
        <span className="text-white/80">© 2026 Nirav Pandey</span>

        <FooterNewsletter />

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
