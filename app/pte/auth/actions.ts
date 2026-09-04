"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PteAuthState = {
  success: boolean;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const studentAuthCallbackPath = "/pte/auth/callback";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function normalizeEmail(formData: FormData) {
  return formData.get("email")?.toString().trim().toLowerCase() ?? "";
}

export async function createPteStudentAccount(
  _prevState: PteAuthState | null,
  formData: FormData,
): Promise<PteAuthState> {
  const email = normalizeEmail(formData);
  const password = formData.get("password")?.toString() ?? "";

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, message: "Enter a valid email address." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, message: "Use a password with at least 8 characters." };
  }

  const supabase = createAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from("pte_leads")
    .select("id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leadError) {
    return { success: false, message: "Could not check your student record. Try again." };
  }

  if (!lead) {
    return {
      success: false,
      message: "I could not find a PTE enquiry for this email. Please use the email you enquired with.",
    };
  }

  const authClient = await createClient();
  const { error } = await authClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}${studentAuthCallbackPath}`,
      data: {
        role: "pte-student",
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { success: false, message: "An account already exists. Please sign in or reset your password." };
    }

    return { success: false, message: error.message };
  }

  return { success: true, message: "Check your email and click the verification link to activate your account." };
}

export async function requestPtePasswordReset(
  _prevState: PteAuthState | null,
  formData: FormData,
): Promise<PteAuthState> {
  const email = normalizeEmail(formData);

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, message: "Enter a valid email address." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/pte/reset-password`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "If an account exists for that email, a password reset link has been sent.",
  };
}

export async function signOutPteStudent() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/pte/login");
}
