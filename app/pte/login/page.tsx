import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import PteStudentLoginClient from "./PteStudentLoginClient";

export const metadata: Metadata = {
  title: "PTE Student Login | Nirav Pandey",
};

export default async function PteStudentLoginPage(props: PageProps<"/pte/login">) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    redirect(isAdminEmail(user.email) ? "/admin" : "/pte/dashboard");
  }

  const notice = searchParams.verify === "email"
    ? "Please click the verification link in your email before opening the dashboard."
    : searchParams.auth === "failed"
      ? "That verification link could not be used. Please try signing in or request a new link."
      : null;

  return <PteStudentLoginClient notice={notice} />;
}
