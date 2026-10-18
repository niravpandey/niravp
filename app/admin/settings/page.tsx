import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { getAuthorProfile, getHomeBlogLimit, MAX_HOME_BLOG_LIMIT } from "@/lib/site-settings";
import { saveAuthorProfileAction, saveHomeBlogLimitAction } from "@/app/admin/portfolio-actions";

export default async function AdminSettingsPage() {
  const homeBlogLimit = await getHomeBlogLimit();
  const authorProfile = await getAuthorProfile();

  async function saveSettings(formData: FormData) {
    "use server";
    await saveHomeBlogLimitAction(formData);
    revalidatePath("/admin/settings");
    redirect("/admin/settings?saved=1");
  }

  async function saveAuthorSettings(formData: FormData) {
    "use server";
    await saveAuthorProfileAction(formData);
    revalidatePath("/admin/settings");
    redirect("/admin/settings?saved=1");
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-8 border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-semibold text-mauve-500">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Control the home page and article author profile.</p>
          </div>

          <form action={saveSettings} className="grid max-w-xl gap-4 border-b border-gray-200 pb-8">
            <div>
              <h2 className="text-sm font-medium text-gray-800">Home page writing</h2>
              <p className="mt-1 text-sm text-gray-500">Choose how many latest published posts appear under My Writing.</p>
            </div>
            <label className="text-xs text-gray-500">
              Number of posts
              <input
                name="homeBlogLimit"
                type="number"
                min={0}
                max={MAX_HOME_BLOG_LIMIT}
                step={1}
                required
                defaultValue={homeBlogLimit}
                className="mt-1 w-full border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              />
            </label>
            <p className="text-xs text-gray-400">Use 0 to hide the writing list. Maximum {MAX_HOME_BLOG_LIMIT} posts.</p>
            <button type="submit" className="w-fit border border-gray-300 bg-white/60 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80">
              Save settings
            </button>
          </form>

          <form action={saveAuthorSettings} encType="multipart/form-data" className="mt-10 grid max-w-xl gap-4 border-b border-gray-200 pb-8">
            <div>
              <h2 className="text-sm font-medium text-gray-800">Article author</h2>
              <p className="mt-1 text-sm text-gray-500">This card appears below every published article.</p>
            </div>
            <div className="flex items-center gap-4">
              <Image src={authorProfile.headshotUrl} alt="Current author headshot" width={72} height={72} className="h-18 w-18 rounded-full border border-gray-200 object-cover" />
              <label className="text-xs text-gray-500">
                Replace headshot
                <input name="authorHeadshot" type="file" accept="image/*" className="mt-1 block w-full text-sm text-gray-600" />
              </label>
            </div>
            <label className="text-xs text-gray-500">
              Author text
              <textarea
                name="authorBio"
                required
                rows={4}
                defaultValue={authorProfile.bio}
                className="mt-1 w-full resize-y border border-gray-200 bg-white/70 px-3 py-2 text-sm leading-6 text-gray-900 focus:border-gray-400 focus:outline-none"
              />
            </label>
            <button type="submit" className="w-fit border border-gray-300 bg-white/60 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80">
              Save author profile
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
