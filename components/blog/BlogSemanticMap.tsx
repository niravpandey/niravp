"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Line, OrbitControls, QuadraticBezierLine } from "@react-three/drei";
import { PCA } from "ml-pca";
import * as THREE from "three";

export type SemanticPost = {
  id: string | number;
  slug: string;
  title: string;
  tags?: string[] | null;
  embedding?: number[] | string | null;
};

type Vec3 = [number, number, number];

type PositionedPost = SemanticPost & {
  position: Vec3;
  vector: number[];
};

type BlogSemanticMapProps = {
  posts: SemanticPost[];
  selectedCategory: string | null;
};

const NODE_COLOR = "#818cf8";
const INACTIVE_COLOR = "#27272a";
const ARC_COLOR = "#6366f1";
const AXIS_COLOR = "#3f3f46";
/** Half-width of the plotted space; the furthest post sits this far from the origin. */
const MAP_RADIUS = 3;
/** Posts at least this similar (cosine) are joined by an arc. */
const ARC_SIMILARITY_THRESHOLD = 0.82;

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
 * Projects post embeddings onto their top three principal components, scaled to fit the map.
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
    const projected = pca.predict(vectors, { nComponents: 3 }).to2DArray();

    const eigenvalues = pca.getEigenvalues();
    const totalVariance = eigenvalues.reduce((sum, value) => sum + value, 0) || 1;
    const top3Variance = eigenvalues.slice(0, 3).reduce((sum, value) => sum + value, 0);

    const maxCoordinate = Math.max(...projected.flat().map(Math.abs)) || 1;
    const scale = MAP_RADIUS / maxCoordinate;

    return {
      posts: usable.map((post, i) => ({
        ...post,
        position: [projected[i][0] * scale, projected[i][1] * scale, (projected[i][2] ?? 0) * scale],
      })),
      variancePercent: (top3Variance / totalVariance) * 100,
    };
  } catch {
    return empty;
  }
}

function Axes() {
  const axes: { label: string; end: Vec3 }[] = [
    { label: "PC₁", end: [MAP_RADIUS, 0, 0] },
    { label: "PC₂", end: [0, MAP_RADIUS, 0] },
    { label: "PC₃", end: [0, 0, MAP_RADIUS] },
  ];

  return (
    <group>
      {axes.map(({ label, end }) => {
        const start = end.map((v) => -v) as Vec3;
        const labelPosition = end.map((v) => (v === 0 ? 0 : v + 0.15)) as Vec3;

        return (
          <group key={label}>
            <Line points={[start, end]} color={AXIS_COLOR} transparent opacity={0.35} />
            <Html position={labelPosition} center>
              <span className="select-none text-[9px] text-zinc-500">{label}</span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/** Curved lines between pairs of closely related posts. */
function SimilarityArcs({ posts }: { posts: PositionedPost[] }) {
  const arcs = useMemo(() => {
    const result: { key: string; start: Vec3; end: Vec3; mid: Vec3 }[] = [];

    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        if (cosineSimilarity(posts[i].vector, posts[j].vector) <= ARC_SIMILARITY_THRESHOLD) continue;

        const start = posts[i].position;
        const end = posts[j].position;
        result.push({
          key: `${posts[i].id}-${posts[j].id}`,
          start,
          end,
          mid: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 0.2, (start[2] + end[2]) / 2],
        });
      }
    }

    return result;
  }, [posts]);

  return (
    <group>
      {arcs.map(({ key, start, end, mid }) => (
        <QuadraticBezierLine
          key={key}
          start={start}
          end={end}
          mid={mid}
          color={ARC_COLOR}
          lineWidth={0.7}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  );
}

type PostNodeProps = {
  post: PositionedPost;
  active: boolean;
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

function PostNode({ post, active, hovered, onHoverChange, onSelect }: PostNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetScale = hovered ? 1.4 : active ? 1 : 0.45;

  // Ease the node toward its target size each frame.
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (mesh) mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, targetScale, 10, delta));
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <group position={post.position}>
        <mesh
          ref={meshRef}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHoverChange(true);
          }}
          onPointerOut={() => onHoverChange(false)}
          onClick={onSelect}
        >
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial
            color={active ? NODE_COLOR : INACTIVE_COLOR}
            emissive={active ? NODE_COLOR : "#000000"}
            emissiveIntensity={hovered ? 0.9 : active ? 0.35 : 0.05}
            roughness={0.25}
          />
        </mesh>

        {hovered && (
          <Html distanceFactor={14} center position={[0, 0.28, 0]}>
            <div className="pointer-events-none max-w-37.5 rounded border border-zinc-800 bg-zinc-950/95 px-2 py-1 text-[10px] shadow-lg backdrop-blur-sm">
              <p className="line-clamp-2 font-medium leading-tight text-zinc-100">{post.title}</p>
              {post.tags && post.tags.length > 0 && (
                <p className="mt-0.5 truncate text-[9px] text-zinc-400">{post.tags.join(" · ")}</p>
              )}
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}

/** 3D map of posts placed by embedding similarity. Posts outside the selected tag are dimmed. */
export default function BlogSemanticMap({ posts, selectedCategory }: BlogSemanticMapProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<SemanticPost["id"] | null>(null);
  const projection = useMemo(() => projectPosts(posts), [posts]);

  if (projection.posts.length === 0) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
        <div className="text-xs font-medium text-zinc-300">Semantic Map</div>
        {projection.variancePercent !== null && (
          <div className="text-[11px] text-zinc-500">{projection.variancePercent.toFixed(0)}% variance captured</div>
        )}
      </div>

      <div className="relative h-72 w-full">
        <Canvas camera={{ position: [4, 3, 6], fov: 40 }}>
          <color attach="background" args={["#09090b"]} />
          <ambientLight intensity={0.6} />
          <pointLight position={[8, 8, 8]} intensity={1.2} />

          <Axes />
          <SimilarityArcs posts={projection.posts} />
          {projection.posts.map((post) => (
            <PostNode
              key={post.id}
              post={post}
              active={!selectedCategory || (post.tags ?? []).includes(selectedCategory)}
              hovered={hoveredId === post.id}
              onHoverChange={(isHovered) => setHoveredId(isHovered ? post.id : null)}
              onSelect={() => router.push(`/blog/${post.slug}`)}
            />
          ))}

          <OrbitControls enablePan={false} minDistance={4} maxDistance={12} autoRotate autoRotateSpeed={0.3} />
        </Canvas>
      </div>
    </div>
  );
}
