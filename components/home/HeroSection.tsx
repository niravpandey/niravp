"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import PhosphorIcon from "@/components/ui/PhosphorIcon";

const RESUME_URL = "https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/resume.pdf";

export default function HeroSection() {
  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    if (!resumeOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setResumeOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resumeOpen]);

  return (
    <>
    <div className="flex flex-col flex-wrap items-start gap-6 border-b border-gray-200 pb-5 sm:flex-row">
      <div className="relative aspect-square w-40 shrink-0 sm:w-48 md:w-56">
        <Image
          src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/headshot.png"
          fill
          alt="Nirav Pandey"
          sizes="(max-width: 640px) 10rem, (max-width: 768px) 12rem, 14rem"
          className="object-cover border border-gray-300 p-1"
        />
      </div>

      <div className="shrink-0">
        <h1 className="text-3xl font-semibold text-blue-900">Nirav Pandey</h1>
        <p className="text-gray-600">Student, University of Melbourne</p>
        <p className="text-gray-600">Bachelor of Science (Data Science) </p>
        <p className="text-gray-600">with a Specialisation in AI</p> 
        <div className="mt-4 flex flex-col gap-1 text-gray-700">
          <a href="mailto:niravp@student.unimelb.edu.au" className="flex items-center gap-2 hover:text-mauve-500">
            <PhosphorIcon name="paper-plane-tilt" size={16} />
            Email
          </a>
          <a href="https://linkedin.com/in/niravpandey05" className="flex items-center gap-2 hover:text-mauve-500">
            <Image
              src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/icons/LinkedIn.png"
              width={16}
              height={16}
              alt="LinkedIn"
              className="h-4 w-4"
            />
            LinkedIn
          </a>
          <a href="https://github.com/niravpandey" className="flex items-center gap-2 hover:text-mauve-500">
            <Image
              src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/icons/GitHub.png"
              width={16}
              height={16}
              alt="GitHub"
              className="h-4 w-4"
            />
            GitHub
          </a>
          <button
            type="button"
            onClick={() => setResumeOpen(true)}
            className="flex items-center gap-2 text-left hover:text-mauve-500"
          >
            <PhosphorIcon name="file-text" size={16} />
            Resume
          </button>
        </div>
      </div>

      <div className="w-full md:flex-1">
        <p className="text-gray-600">
          I grew up in Kathmandu, Nepal, and I am now pursuing my undergraduate
          studies in Melbourne. During my degree, I&apos;ve had the chance to learn about data science, AI and machine 
          learning. 
        </p>
        <p className="mt-2 text-gray-600">
          Beyond academics, I enjoy reading a wide range of literature and working
          on fun projects that challenge me to learn and grow. 
        </p>
        <p className="mt-2 text-gray-600">This is where I write about things that interest me and document my projects</p>
        <p className="mt-2 text-mauve-500">
          Nirav Pandey 
        </p>
        <p className="text-mauve-500">
          09/04/26
        </p>
      </div>
    </div>

    {resumeOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-1 backdrop-blur-sm sm:p-2">
        <button
          type="button"
          aria-label="Close resume"
          onClick={() => setResumeOpen(false)}
          className="absolute inset-0 cursor-default"
        />

        <div className="relative z-10 flex h-[98vh] w-[min(calc(98vh*0.78),calc(100vw-0.5rem))] flex-col border border-gray-300 bg-white shadow-xl sm:w-[min(calc(98vh*0.78),calc(100vw-1rem))]">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <PhosphorIcon name="file-text" size={16} />
              <span>Resume</span>
            </div>
            <button
              type="button"
              aria-label="Close resume"
              onClick={() => setResumeOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center border border-gray-300 text-xl leading-none text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-900"
            >
              ×
            </button>
          </div>

          <iframe
            src={`${RESUME_URL}#page=1&zoom=60&toolbar=0&navpanes=0&scrollbar=0`}
            title="Resume"
            className="min-h-0 flex-1 overflow-hidden border-0"
          />
        </div>
      </div>
    )}
    </>
  );
}
