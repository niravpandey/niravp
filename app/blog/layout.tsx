import RandomWalkMargins from "@/components/blog/RandomWalkMargins";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RandomWalkMargins />
      {/* Its own layer above the walks, so cards, the semantic map and text always sit in front. */}
      <div className="relative z-10">{children}</div>
    </>
  );
}
