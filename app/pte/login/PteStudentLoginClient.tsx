"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { createClient } from "@/lib/supabase/client";
import { EnquiryModal } from "../components/PteEnquiryModal";
import type { ClassType } from "../components/pteContent";
import {
  requestPtePasswordReset,
  type PteAuthState,
} from "../auth/actions";

const initialState: PteAuthState | null = null;

export default function PteStudentLoginClient({ notice }: { notice?: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"sign-in" | "create" | "reset">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState("");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [resetState, resetAction, isResetting] = useActionState(requestPtePasswordReset, initialState);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoginError("Invalid email or password. If you signed up recently, check your email and click the verification link first.");
      setIsSigningIn(false);
      return;
    }

    router.push("/pte/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-8 sm:py-24">
        <Link href="/pte" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
          <PhosphorIcon name="arrow-left" size={16} />
          <span>PTE</span>
        </Link>

        <section className="mt-8 border border-gray-200 bg-white p-5 shadow-sm shadow-gray-100/60 sm:p-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
            {[
              ["sign-in", "Sign in"],
              ["create", "Create account"],
              ["reset", "Forgot password"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const nextMode = value as "sign-in" | "create" | "reset";
                  setMode(nextMode);

                  if (nextMode === "create") {
                    setIsEnquiryOpen(true);
                  }
                }}
                className={`border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  mode === value
                    ? "border-blue-900 bg-blue-900 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {notice ? (
            <p className="mt-4 border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              {notice}
            </p>
          ) : null}

          {mode === "sign-in" ? (
            <form onSubmit={handleSignIn} className="mt-5 grid gap-3">
              <h1 className="text-2xl font-semibold text-blue-900">Student dashboard</h1>
              <p className="text-sm text-gray-600">Sign in with the email you used for your PTE enquiry.</p>
              <AuthEmailField value={email} onChange={setEmail} />
              <AuthPasswordField value={password} onChange={setPassword} />
              {loginError ? <p className="text-sm font-semibold text-red-700">{loginError}</p> : null}
              <button
                type="submit"
                disabled={isSigningIn}
                className="border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isSigningIn ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : mode === "create" ? (
            <div className="mt-5 grid gap-3">
              <h1 className="text-2xl font-semibold text-blue-900">Create account</h1>
              <p className="text-sm text-gray-600">Start with your enquiry details, then verify your student dashboard by email.</p>
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className={buttonClassName}
              >
                Open enquiry form
              </button>
            </div>
          ) : (
            <form action={resetAction} className="mt-5 grid gap-3">
              <h1 className="text-2xl font-semibold text-blue-900">Reset password</h1>
              <p className="text-sm text-gray-600">I&apos;ll email you a secure password reset link.</p>
              <input name="email" type="email" required className={inputClassName} placeholder="Email" />
              {resetState ? <StatusMessage state={resetState} /> : null}
              <button type="submit" disabled={isResetting} className={buttonClassName}>
                {isResetting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </section>
      </main>
      {isEnquiryOpen ? (
        <EnquiryModal
          isOpen={isEnquiryOpen}
          selectedClassType={selectedClassType}
          onClassTypeChange={(classType: ClassType) => setSelectedClassType(classType)}
          onClose={() => setIsEnquiryOpen(false)}
        />
      ) : null}
    </div>
  );
}

const inputClassName =
  "w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15";
const buttonClassName =
  "border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400";

function AuthEmailField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="email"
      required
      autoComplete="email"
      className={inputClassName}
      placeholder="Email"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function AuthPasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="password"
      required
      autoComplete="current-password"
      className={inputClassName}
      placeholder="Password"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function StatusMessage({ state }: { state: PteAuthState }) {
  return (
    <p className={state.success ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>
      {state.message}
    </p>
  );
}
