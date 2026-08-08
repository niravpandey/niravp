import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>Home</span>
          </Link>

          <div className="mt-6 mb-8 flex items-end justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-3xl font-semibold text-mauve-500">Admin</h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>

            <form action={signOut} className="m-0 flex">
              <button
                type="submit"
                className="border border-gray-300 bg-white/50 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:bg-white/80"
              >
                Sign out
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/blog"
              className="group flex flex-col gap-1 border border-gray-200 bg-white/60 p-5 transition-colors hover:border-gray-400 hover:bg-white/80"
            >
              <span className="font-medium text-gray-900 transition-colors group-hover:text-blue-900">Writing</span>
              <span className="text-sm text-gray-500">Manage blog posts and essays</span>
            </Link>

            <Link
              href="/admin/projects"
              className="group flex flex-col gap-1 border border-gray-200 bg-white/60 p-5 transition-colors hover:border-gray-400 hover:bg-white/80"
            >
              <span className="font-medium text-gray-900 transition-colors group-hover:text-blue-900">Projects</span>
              <span className="text-sm text-gray-500">Manage portfolio projects and their order</span>
            </Link>
            <Link
              href="/admin/gallery"
              className="group flex flex-col gap-1 border border-gray-200 bg-white/60 p-5 transition-colors hover:border-gray-400 hover:bg-white/80"
            >
              <span className="font-medium text-gray-900 transition-colors group-hover:text-blue-900">Gallery</span>
              <span className="text-sm text-gray-500">Upload images</span>
            </Link>

            <Link
              href="/admin/resume"
              className="group flex flex-col gap-1 border border-gray-200 bg-white/60 p-5 transition-colors hover:border-gray-400 hover:bg-white/80"
            >
              <span className="font-medium text-gray-900 transition-colors group-hover:text-blue-900">Resume</span>
              <span className="text-sm text-gray-500">Upload the public PDF</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
