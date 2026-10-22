"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PCA } from "ml-pca";
import { cn } from "@/lib/utils";

export type SemanticPost = {
  id: string | number;
  slug: string;
  title: string;
  tags?: string[] | null;
  embedding?: number[] | string | null;
};

type PositionedPost = SemanticPost & {
  x: number;
  y: number;
  vector: number[];
};

type BlogSemanticMapProps = {
  posts: SemanticPost[];
  selectedCategory: string | null;
};

// SVG coordinate space. The origin sits in the centre and both axes share one scale, so the grid is square.
const WIDTH = 1000;
const HEIGHT = 400;
const PADDING_X = 40;
const PADDING_Y = 30;
const GRID_SIZE = 40;
/** Posts at least this similar (cosine) are joined by a line. */
const LINK_SIMILARITY_THRESHOLD = 0.82;
const LABEL_MAX_CHARS = 48;

/** Embeddings arrive either as a number array or as pgvector text like "[0.1,0.2]". */
function parseEmbedding(raw: SemanticPost["embedding"]): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch {
    // Not JSON; fall through to splitting on commas.
  }

  return raw
    .replace(/[[\]]/g, "")
    .split(",")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Projects post embeddings onto their top two principal components, centred on the origin with the same scale on
 * both axes, so distances mean the same thing in every direction.
 * Also returns the share of variance those components explain, as a percentage.
 */
function projectPosts(posts: SemanticPost[]): { posts: PositionedPost[]; variancePercent: number | null } {
  const empty = { posts: [], variancePercent: null };

  const withVectors = posts.map((post) => ({ ...post, vector: parseEmbedding(post.embedding) }));
  const dimension = withVectors.find((post) => post.vector.length > 0)?.vector.length;
  const usable = withVectors.filter((post) => post.vector.length > 0 && post.vector.length === dimension);
  if (usable.length < 2) return empty;

  try {
    const vectors = usable.map((post) => post.vector);
    const pca = new PCA(vectors);
    const projected = pca.predict(vectors, { nComponents: 2 }).to2DArray();

    const eigenvalues = pca.getEigenvalues();
    const totalVariance = eigenvalues.reduce((sum, value) => sum + value, 0) || 1;
    const top2Variance = eigenvalues.slice(0, 2).reduce((sum, value) => sum + value, 0);

    // PCA output is already centred on the mean, so 0 is the middle of the map. Pick the one scale that fits both axes.
    const maxX = Math.max(...projected.map((point) => Math.abs(point[0]))) || 1;
    const maxY = Math.max(...projected.map((point) => Math.abs(point[1] ?? 0))) || 1;
    const scale = Math.min((WIDTH / 2 - PADDING_X) / maxX, (HEIGHT / 2 - PADDING_Y) / maxY);
    // Rounded so the server and browser produce identical coordinates. SVG y grows downwards, so PC₂ is flipped.
    const toSvg = (value: number, centre: number) => Math.round((centre + value * scale) * 10) / 10;

    return {
      posts: usable.map((post, i) => ({
        ...post,
        x: toSvg(projected[i][0], WIDTH / 2),
        y: toSvg(-(projected[i][1] ?? 0), HEIGHT / 2),
      })),
      variancePercent: (top2Variance / totalVariance) * 100,
    };
  } catch {
    return empty;
  }
}

function shortTitle(title: string) {
  return title.length > LABEL_MAX_CHARS ? `${title.slice(0, LABEL_MAX_CHARS - 1)}…` : title;
}

/** Flat 2D map of posts placed by embedding similarity. Posts outside the selected tag are dimmed. */
export default function BlogSemanticMap({ posts, selectedCategory }: BlogSemanticMapProps) {
  const [hoveredId, setHoveredId] = useState<SemanticPost["id"] | null>(null);
  const projection = useMemo(() => projectPosts(posts), [posts]);

  const links = useMemo(() => {
    const placed = projection.posts;
    const result: { key: string; from: PositionedPost; to: PositionedPost }[] = [];
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        if (cosineSimilarity(placed[i].vector, placed[j].vector) > LINK_SIMILARITY_THRESHOLD) {
          result.push({ key: `${placed[i].id}-${placed[j].id}`, from: placed[i], to: placed[j] });
        }
      }
    }
    return result;
  }, [projection.posts]);

  if (projection.posts.length === 0) return null;

  const isActive = (post: SemanticPost) => !selectedCategory || (post.tags ?? []).includes(selectedCategory);
  const hovered = projection.posts.find((post) => post.id === hoveredId);

  return (
    <div className="border border-gray-200 bg-white p-4 font-mono text-xs text-gray-500">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Map of posts by similarity">
        {/* Square grid lines out from the origin, then the two axes through it */}
        {Array.from({ length: Math.floor(WIDTH / 2 / GRID_SIZE) }, (_, i) => (i + 1) * GRID_SIZE).flatMap((offset) => [
          <line key={`x+${offset}`} x1={WIDTH / 2 + offset} y1={0} x2={WIDTH / 2 + offset} y2={HEIGHT} className="stroke-gray-100" />,
          <line key={`x-${offset}`} x1={WIDTH / 2 - offset} y1={0} x2={WIDTH / 2 - offset} y2={HEIGHT} className="stroke-gray-100" />,
        ])}
        {Array.from({ length: Math.floor(HEIGHT / 2 / GRID_SIZE) }, (_, i) => (i + 1) * GRID_SIZE).flatMap((offset) => [
          <line key={`y+${offset}`} x1={0} y1={HEIGHT / 2 + offset} x2={WIDTH} y2={HEIGHT / 2 + offset} className="stroke-gray-100" />,
          <line key={`y-${offset}`} x1={0} y1={HEIGHT / 2 - offset} x2={WIDTH} y2={HEIGHT / 2 - offset} className="stroke-gray-100" />,
        ])}
        <line x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} className="stroke-gray-300" />
        <line x1={WIDTH / 2} y1={0} x2={WIDTH / 2} y2={HEIGHT} className="stroke-gray-300" />
        <text x={WIDTH - 6} y={HEIGHT / 2 - 8} textAnchor="end" className="fill-gray-400 text-[12px]">
          PC₁
        </text>
        <text x={WIDTH / 2 + 8} y={16} className="fill-gray-400 text-[12px]">
          PC₂
        </text>

        {links.map(({ key, from, to }) => (
          <line
            key={key}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            strokeWidth={1}
            className={cn(
              "transition-colors",
              hoveredId === from.id || hoveredId === to.id ? "stroke-blue-900/50" : "stroke-gray-200",
            )}
          />
        ))}

        {projection.posts.map((post) => {
          const active = isActive(post);
          const isHovered = hoveredId === post.id;
          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              onMouseEnter={() => setHoveredId(post.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(post.id)}
              onBlur={() => setHoveredId(null)}
              className={cn("transition-opacity", !active && "opacity-25")}
            >
              <circle cx={post.x} cy={post.y} r={isHovered ? 7 : 5} className="fill-blue-900 transition-all" />
            </Link>
          );
        })}

        {/* Only the hovered post gets a title, drawn last so it sits above the other dots. It goes left of the dot
            in the right half of the map so it never runs off the edge. */}
        {hovered && (
          <text
            x={hovered.x > WIDTH / 2 ? hovered.x - 14 : hovered.x + 14}
            y={hovered.y + 4}
            textAnchor={hovered.x > WIDTH / 2 ? "end" : "start"}
            paintOrder="stroke"
            strokeWidth={4}
            strokeLinejoin="round"
            className="pointer-events-none fill-blue-900 stroke-white text-[13px]"
          >
            {shortTitle(hovered.title)}
          </text>
        )}
      </svg>

      <div className="mt-2 flex justify-between gap-4 text-gray-400">
        <span className="truncate">
          {hovered ? (
            <>
              <span className="text-blue-900">{hovered.title}</span>
              {hovered.tags && hovered.tags.length > 0 && ` · ${hovered.tags.join(" · ")}`}
            </>
          ) : (
            `closer = more similar${links.length > 0 ? " · lines join closely related posts" : ""}`
          )}
        </span>
        {projection.variancePercent !== null && (
          <span className="shrink-0">{projection.variancePercent.toFixed(0)}% variance captured</span>
        )}
      </div>
    </div>
  );
}
