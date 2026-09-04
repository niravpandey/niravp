"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordClient() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError(error.message);
        return;
      }

      window.history.replaceState(null, "", "/pte/reset-password");
    });
  }, [supabase.auth]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsSaving(false);
      return;
    }

    setMessage("Password updated. Redirecting...");
    router.push("/pte/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-16 font-sans sm:px-8 sm:py-24">
      <Link href="/pte/login" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
        <PhosphorIcon name="arrow-left" size={16} />
        <span>Login</span>
      </Link>
      <section className="mt-8 border border-gray-200 bg-white p-5 shadow-sm shadow-gray-100/60 sm:p-6">
        <h1 className="text-2xl font-semibold text-blue-900">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="New password"
            className="w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
          <button
            type="submit"
            disabled={isSaving}
            className="border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isSaving ? "Saving..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
