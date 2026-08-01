"use client";

import { useActionState } from "react";
import { requestVerification } from "@/app/actions/newsletter";

export default function NewsletterSection() {
  const [state, formAction, isPending] = useActionState(requestVerification, null);

  return (
    <section className="mt-0 pb-10">
      <div className="border border-gray-200 bg-white/50 p-5 sm:p-6 transition-colors">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Subscribe to my newsletter
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              I have one?
            </p>
          </div>

          <form action={formAction} className="flex w-full flex-col gap-2 sm:max-w-xs">
            <div className="flex w-full min-w-0 items-center gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="nirav@example.com"
                disabled={isPending || state?.success}
                className="w-full rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isPending || state?.success}
                className="shrink-0 rounded-full bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {isPending ? "Sending..." : "Send"}
              </button>
            </div>

            {/* Status Messages */}
            {state && (
              <p
                className={`text-[11px] ${
                  state.success ? "bg-emerald-500 px-2 w-full text-center rounded-full text-white font-semibold" : "text-red-600"
                }`}
              >
                {state.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}