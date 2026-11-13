"use client";

import { useActionState, useState } from "react";
import { requestVerification } from "@/app/actions/newsletter";

/**
 * Footer newsletter: a plain "Subscribe to my newsletter" link that opens a small email field in place.
 * Both states share one fixed-size box so the footer doesn't shift when it opens.
 * Escape closes it; after sending, the status message takes its place.
 */
export default function FooterNewsletter() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(requestVerification, null);

  let content;
  if (state?.success) {
    content = (
      <p role="status" className="truncate text-white/80">
        {state.message}
      </p>
    );
  } else if (!open) {
    content = (
      <button type="button" onClick={() => setOpen(true)} className="underline-offset-4 transition-opacity hover:underline hover:opacity-80">
        Subscribe to my newsletter
      </button>
    );
  } else {
    content = (
      <form action={formAction} onKeyDown={(event) => event.key === "Escape" && setOpen(false)} className="flex h-full w-full">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          name="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="you@email.com"
          disabled={isPending}
          className="min-w-0 flex-1 rounded-l border border-white/40 bg-white/10 px-2 text-white placeholder:text-white/50 focus:border-white focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-r border border-l-0 border-white bg-white px-2.5 font-medium text-mauve-800 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Subscribe"}
        </button>
        {state && (
          <span role="status" className="absolute bottom-full left-0 mb-1 text-xs text-white/70">
            {state.message}
          </span>
        )}
      </form>
    );
  }

  return <div className="relative flex h-6 w-60 items-center">{content}</div>;
}
