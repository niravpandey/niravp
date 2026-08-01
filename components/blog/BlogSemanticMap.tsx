"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Float, QuadraticBezierLine } from "@react-three/drei";
import { PCA } from "ml-pca";
import * as THREE from "three";

export interface SemanticPost {
  id: string | number;
  slug: string;
  title: string;
  tags?: string[] | null;
  embedding?: number[] | string | null;
}

interface BlogSemanticMapProps {
  posts: SemanticPost[];
  selectedCategory: string | null;
}

interface PositionedPost extends SemanticPost {
  x: number;
  y: number;
  z: number;
  vector: number[];
}

// Unified Monochromatic Palette
const NODE_COLOR = "#818cf8"; // Sleek Indigo
const INACTIVE_COLOR = "#27272a";

function parseEmbedding(raw: number[] | string | null | undefined): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch {}

  return raw
    .replace(/[\[\]]/g, "")
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  const denom = Math.sqrt(ma) * Math.sqrt(mb);
  return denom === 0 ? 0 : dot / denom;
}

function MinimalAxes({ length = 3 }: { length?: number }) {
  const lineMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#3f3f46", transparent: true, opacity: 0.35 }),
    []
  );

  const pointsX = useMemo(() => [new THREE.Vector3(-length, 0, 0), new THREE.Vector3(length, 0, 0)], [length]);
  const pointsY = useMemo(() => [new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, length, 0)], [length]);
  const pointsZ = useMemo(() => [new THREE.Vector3(0, 0, -length), new THREE.Vector3(0, 0, length)], [length]);

  return (
    <group>
      <primitive object={new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsX), lineMaterial)} />
      <Html position={[length + 0.15, 0, 0]} center>
        <span className="text-[9px] text-zinc-500 select-none">PC₁</span>
      </Html>

      <primitive object={new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsY), lineMaterial)} />
      <Html position={[0, length + 0.15, 0]} center>
        <span className="text-[9px] text-zinc-500 select-none">PC₂</span>
      </Html>

      <primitive object={new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsZ), lineMaterial)} />
      <Html position={[0, 0, length + 0.15]} center>
        <span className="text-[9px] text-zinc-500 select-none">PC₃</span>
      </Html>
    </group>
  );
}

function ArcConnections({ posts }: { posts: PositionedPost[] }) {
  const connections = useMemo(() => {
    const lines: Array<{ start: [number, number, number]; end: [number, number, number]; mid: [number, number, number] }> = [];

    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const sim = cosineSimilarity(posts[i].vector, posts[j].vector);
        if (sim > 0.82) {
          lines.push({
            start: [posts[i].x, posts[i].y, posts[i].z],
            end: [posts[j].x, posts[j].y, posts[j].z],
            mid: [
              (posts[i].x + posts[j].x) / 2,
              (posts[i].y + posts[j].y) / 2 + 0.2,
              (posts[i].z + posts[j].z) / 2,
            ],
          });
        }
      }
    }
    return lines;
  }, [posts]);

  return (
    <group>
      {connections.map((conn, idx) => (
        <QuadraticBezierLine
          key={idx}
          start={conn.start}
          end={conn.end}
          mid={conn.mid}
          color="#6366f1"
          lineWidth={0.7}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  );
}

function Node({
  post,
  selectedCategory,
  hovered,
  setHovered,
}: {
  post: PositionedPost;
  selectedCategory: string | null;
  hovered: string | number | null;
  setHovered: (v: string | number | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const isHovered = hovered === post.id;
  const active = !selectedCategory || (post.tags ?? []).includes(selectedCategory);

  const targetScale = isHovered ? 1.4 : active ? 1 : 0.45;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, 10, delta)
      );
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <group position={[post.x, post.y, post.z]}>
        <mesh
          ref={meshRef}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(post.id);
          }}
          onPointerOut={() => setHovered(null)}
          onClick={() => {
            window.location.href = `/blog/${post.slug}`;
          }}
        >
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial
            color={active ? NODE_COLOR : INACTIVE_COLOR}
            emissive={active ? NODE_COLOR : "#000000"}
            emissiveIntensity={isHovered ? 0.9 : active ? 0.35 : 0.05}
            roughness={0.25}
          />
        </mesh>

        {isHovered && (
          <Html distanceFactor={14} center position={[0, 0.28, 0]}>
            <div className="pointer-events-none max-w-37.5 rounded border border-zinc-800 bg-zinc-950/95 px-2 py-1 text-[10px] shadow-lg backdrop-blur-sm">
              <p className="line-clamp-2 font-medium leading-tight text-zinc-100">
                {post.title}
              </p>
              {post.tags && post.tags.length > 0 && (
                <p className="mt-0.5 truncate text-[9px] text-zinc-400">
                  {post.tags.join(" · ")}
                </p>
              )}
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}

export default function BlogSemanticMap({
  posts,
  selectedCategory,
}: BlogSemanticMapProps) {
  const [hovered, setHovered] = useState<string | number | null>(null);

  const { projectedPosts, totalVariance } = useMemo(() => {
    const parsed = posts.map((p) => ({
      ...p,
      vector: parseEmbedding(p.embedding),
    }));

    const valid = parsed.filter((p) => p.vector.length > 0);
    if (valid.length < 2) return { projectedPosts: [], totalVariance: null };

    const dim = valid[0].vector.length;
    const clean = valid.filter((p) => p.vector.length === dim);
    if (clean.length < 2) return { projectedPosts: [], totalVariance: null };

    const vectors = clean.map((p) => p.vector);

    try {
      const pca = new PCA(vectors);
      const result = pca.predict(vectors, { nComponents: 3 }).to2DArray();

      const eigenvalues = pca.getEigenvalues();
      const sumEV = eigenvalues.reduce((a, b) => a + b, 0);
      const top3EV = (eigenvalues.slice(0, 3).reduce((a, b) => a + b, 0) / (sumEV || 1)) * 100;

      const allVals = result.flat();
      const maxVal = Math.max(...allVals.map(Math.abs)) || 1;
      const scaleFactor = 3 / maxVal;

      const projected = clean.map((p, i) => ({
        ...p,
        x: result[i][0] * scaleFactor,
        y: result[i][1] * scaleFactor,
        z: (result[i][2] ?? 0) * scaleFactor,
      }));

      return { projectedPosts: projected, totalVariance: top3EV.toFixed(0) };
    } catch {
      return { projectedPosts: [], totalVariance: null };
    }
  }, [posts]);

  if (!projectedPosts.length) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
        <div className="text-xs font-medium text-zinc-300">
          Semantic Map
        </div>
        {totalVariance && (
          <div className="text-[11px] text-zinc-500">
            {totalVariance}% variance captured
          </div>
        )}
      </div>

      <div className="relative h-72 w-full">
        <Canvas camera={{ position: [4, 3, 6], fov: 40 }}>
          <color attach="background" args={["#09090b"]} />

          <ambientLight intensity={0.6} />
          <pointLight position={[8, 8, 8]} intensity={1.2} />

          <MinimalAxes length={3} />

          <group>
            <ArcConnections posts={projectedPosts} />
            {projectedPosts.map((post) => (
              <Node
                key={post.id}
                post={post}
                selectedCategory={selectedCategory}
                hovered={hovered}
                setHovered={setHovered}
              />
            ))}
          </group>

          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={12}
            autoRotate
            autoRotateSpeed={0.3}
          />
        </Canvas>
      </div>
    </div>
  );
}