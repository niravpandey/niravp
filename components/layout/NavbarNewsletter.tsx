"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { requestVerification } from "@/app/actions/newsletter";
import { cn } from "@/lib/utils";

/** "Newsletter" text link in the navbar that opens a small sign-up panel. */
export default function NavbarNewsletter() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(requestVerification, null);
  const isDisabled = isPending || state?.success;
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the panel or on Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="navbar-newsletter"
        onClick={() => setOpen((current) => !current)}
        className="text-sm font-medium transition-opacity hover:opacity-80"
      >
        Newsletter
      </button>

      {open && (
        <div
          id="navbar-newsletter"
          className="absolute top-full right-0 z-30 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-lg"
        >
          <p className="font-serif text-lg font-medium text-blue-900">Subscribe to my newsletter</p>
          <p className="mt-1 text-xs text-gray-500">Occasional updates when I publish something new.</p>

          <form action={formAction} className="mt-3 flex flex-col gap-2">
            <label htmlFor="navbar-newsletter-email" className="text-xs font-medium text-gray-700">
              Email address
            </label>
            <input
              id="navbar-newsletter-email"
              type="email"
              name="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isDisabled}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isDisabled}
              className="rounded-md bg-blue-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
            >
              {isPending ? "Sending..." : "Subscribe"}
            </button>
          </form>

          {state && (
            <p role="status" className={cn("mt-2 text-xs", state.success ? "text-blue-900" : "text-rose-700")}>
              {state.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
