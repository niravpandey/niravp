import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminProviders from "./AdminProviders";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <AdminProviders>{children}</AdminProviders>;
}
