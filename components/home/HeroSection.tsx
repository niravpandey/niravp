import Image from "next/image";
import Link from "next/link";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { getAssetUrl } from "@/lib/supabase/storage";
import HeadshotRotator from "@/components/home/HeadshotRotator";

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://linkedin.com/in/niravpandey05", icon: getAssetUrl("icons/LinkedIn.png") },
  { label: "GitHub", href: "https://github.com/niravpandey", icon: getAssetUrl("icons/GitHub.png") },
];

// Small boxed buttons in a row, so the links read as a block instead of a long list. They turn green
// (the palette's line colour) on hover.
const linkClass =
  "relative flex items-center gap-2 overflow-hidden border border-line bg-surface px-3 py-1.5 text-sm transition-colors hover:bg-line hover:text-white";

export default function HeroSection({ headshots }: { headshots: string[] }) {
  return (
    <div className="flex w-full flex-col flex-wrap items-start gap-6 border-b border-line pb-5 sm:flex-row">
      <HeadshotRotator urls={headshots} />

      <div className="shrink-0">
        <h1 className="font-serif text-5xl font-heading tracking-heading text-heading">Nirav Pandey</h1>
        <p className="mt-1 text-gray-600">Student, University of Melbourne</p>
        <p className="text-sm text-gray-500">BSc (Data Science) · Specialisation in AI</p>

        <div className="mt-4 flex flex-wrap gap-2 text-gray-700">
          <a href="mailto:niravp@student.unimelb.edu.au" className={linkClass}>
            <PhosphorIcon name="paper-plane-tilt" size={16} />
            Email
          </a>
          <Link href="/resume" className={linkClass}>
            <PhosphorIcon name="file-text" size={16} />
            Resume
          </Link>
          {/* The logos speak for themselves, so these are icon-only (the label stays for screen readers and hover). */}
          {SOCIAL_LINKS.map(({ label, href, icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={`group ${linkClass}`}>
              <Image src={icon} width={16} height={16} alt="" className="h-4 w-4" />
              {/* On hover, a green cover slides over the logo with an arrow. */}
              <span className="absolute inset-0 flex translate-y-full items-center justify-center bg-line text-white transition-transform duration-200 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transition-none">
                <PhosphorIcon name="arrow-up-right" size={16} />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* A short letter to the reader, in its own small box. */}
      <div className="group/letter relative w-full self-start overflow-hidden border border-line bg-letter px-4 py-3 text-sm leading-6 text-gray-700 md:w-auto md:min-w-0 md:flex-1">
        {/* Kathmandu skyline (public/kathmandu_skyline.svg, used as a mask so its colour comes from --skyline).
            It fades in, small, in the bottom-right corner while "Kathmandu, Nepal" is hovered. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 aspect-[506/119] w-full bg-skyline opacity-0 transition-opacity duration-500 ease-out group-has-[.kathmandu:hover]/letter:opacity-[0.07] motion-reduce:transition-none"
          style={{
            maskImage: "url(/kathmandu_skyline.svg)",
            maskSize: "100% 100%",
            maskRepeat: "no-repeat",
          }}
        />
        <p className="relative">
          I grew up in <span className="kathmandu cursor-default">Kathmandu, Nepal</span>, and I am now pursuing my undergraduate studies in Melbourne. During my
          degree, I&apos;ve had the chance to learn about data science, AI and machine learning.
        </p>
        <p className="relative mt-2">
          Beyond academics, I enjoy reading a wide range of literature and working on fun projects that challenge
          me to learn and grow.
        </p>
        <p className="relative mt-2">This is where I write about things that interest me and document my projects.</p>
        <p className="relative mt-2 text-mauve-500">Nirav Pandey · 09/04/26</p>
      </div>
    </div>
  );
}

