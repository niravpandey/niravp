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
      <header className="bottom-0 z-40 bg-white/65 backdrop-blur-md dark:bg-black/55 border-t border-zinc-200 dark:border-green-400">
          <div className=" flex h-50 items-center justify-center flex-col gap-2 p-4">
            <p>
                Website by Nirav Pandey
            </p>
            <p>
                Source code at <a href="https://www.github.com/niravpandey">Github</a>
            </p>
          </div>
      </header>
    </>
  );
}
