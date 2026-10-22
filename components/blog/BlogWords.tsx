import Link from "next/link";
import type { PostSummary } from "@/lib/blog";
import { cn } from "@/lib/utils";

const WORDS_PER_MINUTE = 230;

type BlogWordsProps = {
  posts: PostSummary[];
  wordCounts: Record<string, number>;
  selectedCategory: string | null;
};

/** Total words and reading time, then one bar per post by length. Posts outside the selected tag are dimmed. */
export default function BlogWords({ posts, wordCounts, selectedCategory }: BlogWordsProps) {
  const rows = posts
    .map((post) => ({ post, words: wordCounts[post.id] ?? 0 }))
    .filter((row) => row.words > 0)
    .sort((a, b) => b.words - a.words);
  if (rows.length === 0) return null;

  const counted = selectedCategory ? rows.filter((row) => row.post.tags?.includes(selectedCategory)) : rows;
  const total = counted.reduce((sum, row) => sum + row.words, 0);
  const longest = rows[0].words;

  return (
    <div className="border border-gray-200 bg-white p-4 font-mono text-xs text-gray-500">
      <p className="text-gray-400">
        <span className="text-blue-900">{total.toLocaleString("en-US")}</span> words ·{" "}
        <span className="text-blue-900">~{Math.max(1, Math.round(total / WORDS_PER_MINUTE))}</span> min of reading ·{" "}
        {counted.length} post{counted.length === 1 ? "" : "s"}
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        {rows.map(({ post, words }) => {
          const dimmed = selectedCategory !== null && !post.tags?.includes(selectedCategory);
          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={cn("group flex items-center gap-3 transition-opacity", dimmed && "opacity-30")}
            >
              <span className="w-40 shrink-0 truncate transition-colors group-hover:text-blue-900 sm:w-56">
                {post.title}
              </span>
              <span className="h-1.5 flex-1 bg-gray-100">
                <span
                  className="block h-full bg-blue-900/70 transition-colors group-hover:bg-blue-900"
                  style={{ width: `${(words / longest) * 100}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right tabular-nums">{words.toLocaleString("en-US")}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
