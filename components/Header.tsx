"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "./ModeToggle";
import { Genos } from "next/font/google";

const genos = Genos({ subsets: ['latin'], weight: '700' });

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/65 backdrop-blur-md dark:bg-black/55 border-b border-zinc-200 dark:border-green-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo / title */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                {/* optional avatar — replace src with your image or remove */}
                
                <span className={`${genos.className} text-4xl text-zinc-900 dark:text-zinc-100 hover:text-blue-800`}>
                  NIRAVP
                </span>
              </Link>
            </div>

            {/* Center / Right: nav + utilities */}
            <nav className="hidden md:flex md:items-center md:gap-6" aria-label="Primary">
              <Link
                href="/"
                className="text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-300 rounded px-2 py-1 dark:focus:ring-zinc-700"
              >
                Home
              </Link>
              <Link
                href="/projects"
                className="text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-300 rounded px-2 py-1 dark:focus:ring-zinc-700"
              >
                Projects
              </Link>
              <Link
                href="/blog"
                className="text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-300 rounded px-2 py-1 dark:focus:ring-zinc-700"
              >
                Blog
              </Link>
              <Link
                href="/about"
                className="text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-300 rounded px-2 py-1 dark:focus:ring-zinc-700"
              >
                About
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {/* Resume / CTA */}
              <Link
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center rounded-md border px-3 py-1.75 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
              >
                Resume
              </Link>

              {/* Theme toggle */}
              <div className="flex items-center">
                <ModeToggle />
              </div>

              {/* Mobile menu button */}
              <button
                className="ml-1 inline-flex items-center rounded-md p-2 md:hidden focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label="Toggle menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-zinc-800 dark:text-zinc-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {open ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          id="mobile-menu"
          className={`md:hidden ${open ? "block" : "hidden"} border-t border-zinc-200 dark:border-zinc-800`}
        >
          <div className="space-y-1 px-4 py-3">
            <Link href="/" className="block rounded px-2 py-2 text-base hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Home
            </Link>
            <Link href="/projects" className="block rounded px-2 py-2 text-base hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Projects
            </Link>
            <Link href="/blog" className="block rounded px-2 py-2 text-base hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Blog
            </Link>
            <Link href="/about" className="block rounded px-2 py-2 text-base hover:bg-zinc-100 dark:hover:bg-zinc-900">
              About
            </Link>
            <Link href="/resume.pdf" className="block rounded px-2 py-2 text-base hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Resume
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
