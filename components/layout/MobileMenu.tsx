"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

/** Phone-only menu: a ☰ toggle that drops the nav links in a plain list under the bar. */
export default function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="px-1 text-xl leading-none transition-opacity hover:opacity-80"
      >
        {open ? "×" : "☰"}
      </button>
      {open && (
        <ul id="mobile-menu" className="absolute inset-x-0 top-full bg-palette-gradient px-4 pb-3 text-sm font-bold">
          {links.map((link) => (
            <li key={link.href}>
              {/* The navbar stays mounted across pages, so close the menu on navigation. */}
              <Link href={link.href} onClick={() => setOpen(false)} className="block py-1.5 transition-opacity hover:opacity-80">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
