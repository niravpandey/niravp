"use client";

import { useActionState } from "react";
import { requestVerification } from "@/app/actions/newsletter";

export default function NewsletterSection() {
  const [state, formAction, isPending] = useActionState(requestVerification, null);

  return (
    <section className="mx-auto w-88 max-w-[calc(100vw-2rem)] lg:w-full">
      <div className="border border-blue-900 bg-blue-900 p-3 text-white shadow-[0_10px_30px_rgba(30,58,138,0.18)] transition-shadow hover:shadow-[0_14px_38px_rgba(30,58,138,0.28)]">
        <form action={formAction} className="flex w-full min-w-0 flex-wrap items-center gap-2.5">
          <span className="shrink-0 basis-full text-xs font-semibold uppercase tracking-wider text-white xl:basis-auto">
            Subscribe to My Newsletter
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder="email@domain.com"
            disabled={isPending || state?.success}
            className="min-w-36 flex-1 rounded-full border border-white/30 bg-white/95 px-3 py-1.5 text-xs text-blue-950 placeholder:text-blue-900/45 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/35 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || state?.success}
            className="shrink-0 rounded-full border border-white bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-50 disabled:opacity-50"
          >
            {isPending ? "..." : "Subscribe"}
          </button>
        </form>

        {state && (
          <p
            className={`mt-2 text-center text-[11px] ${
              state.success ? "rounded-full bg-white px-2 font-semibold text-blue-900" : "text-blue-100"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </section>
  );
}
