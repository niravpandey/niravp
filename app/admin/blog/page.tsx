import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { setPostPinned } from "./[id]/actions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FILTERS = [
  { key: "drafts", label: "Working on" },
  { key: "published", label: "Published" },
  { key: "all", label: "All" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "No date";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === show) ? (show as FilterKey) : "drafts";

  const posts = await getAllPosts();
  const counts: Record<FilterKey, number> = {
    drafts: posts.filter((post) => !post.published).length,
    published: posts.filter((post) => post.published).length,
    all: posts.length,
  };
  const visible = posts.filter((post) =>
    filter === "all" ? true : filter === "published" ? post.published : !post.published,
  );

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="w-full max-w-4xl">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <PhosphorIcon name="arrow-left" size={16} />
            <span>Admin</span>
          </Link>

          <div className="mt-6 mb-6 flex items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <h1 className="text-3xl font-semibold text-mauve-500">Writing</h1>
              <p className="mt-1 text-sm text-gray-500">Drafts, published pieces, and editing access in one place.</p>
            </div>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 border border-line bg-white/50 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-line hover:bg-white/80"
            >
              <PhosphorIcon name="file-plus" size={16} />
              <span>New post</span>
            </Link>
          </div>

          <nav aria-label="Filter posts" className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {FILTERS.map(({ key, label }) => {
              const active = key === filter;
              return (
                <Link
                  key={key}
                  href={key === "drafts" ? "/admin/blog" : `/admin/blog?show=${key}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "font-medium text-gray-900 underline underline-offset-4"
                      : "text-gray-500 transition-colors hover:text-gray-900"
                  }
                >
                  {label} ({counts[key]})
                </Link>
              );
            })}
          </nav>

          {visible.length === 0 ? (
            <p className="text-sm text-gray-400">
              {filter === "drafts" ? "Nothing in progress." : filter === "published" ? "Nothing published yet." : "No posts yet."}
            </p>
          ) : (
            <div className="divide-y divide-line border-y border-line">
              {visible.map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{post.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {post.pinned && <span className="text-mauve-500">Pinned · </span>}
                      {formatDate(post.created_at)} · {post.published ? "Published" : "Draft"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <form action={setPostPinned.bind(null, post.id, !post.pinned)} className="m-0 flex">
                      <button type="submit" className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                        {post.pinned ? "Unpin" : "Pin"}
                      </button>
                    </form>
                    {post.published && (
                      <Link href={`/blog/${post.slug}`} className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                        View
                      </Link>
                    )}
                    <Link href={`/admin/blog/${post.id}`} className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
