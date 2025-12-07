// app/api/like/route.ts
import clientPromise from "@/lib/mongo";
import { NextRequest, NextResponse } from "next/server";

function getClientIp(req: NextRequest): string {
  // Try standard proxy headers first (e.g. Vercel, Nginx, Cloudflare)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // May be a list: "client, proxy1, proxy2"
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Last-resort fallback
  // @ts-ignore - NextRequest doesn't type ip in all runtimes
  if ((req as any).ip) return (req as any).ip;

  return "unknown";
}

/**
 * POST /api/like
 * Body: { postId: string }
 * Effect: Registers a like for (post_id, ip) if not already liked.
 */
export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();

    if (!postId || typeof postId !== "string") {
      return NextResponse.json(
        { ok: false, error: "postId is required" },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || "blog";
    const db = client.db(dbName);

    try {
      // upsert + unique index (post_id + ip) = one like per IP per post
      await db.collection("likes").updateOne(
        { post_id: postId, ip },
        {
          $setOnInsert: {
            post_id: postId,
            ip,
            liked_at: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        ok: true,
        postId,
        ip,
        status: "liked",
      });
    } catch (err: any) {
      // Duplicate key error from unique compound index
      if (err?.code === 11000) {
        return NextResponse.json(
          {
            ok: false,
            postId,
            ip,
            status: "already-liked",
          },
          { status: 409 }
        );
      }

      console.error("Error updating like:", err);
      return NextResponse.json(
        { ok: false, error: "Internal error" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Invalid JSON body:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/like?postId=...
 * Returns: { postId, likes }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json(
      { ok: false, error: "postId query param is required" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || "blog";
    const db = client.db(dbName);

    const likes = await db
      .collection("likes")
      .countDocuments({ post_id: postId });

    return NextResponse.json({
      ok: true,
      postId,
      likes,
    });
  } catch (err) {
    console.error("Error counting likes:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
