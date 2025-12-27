import clientPromise from "@/lib/mongodb";

type LikeRequest = {
  slug?: string;
  action?: "like" | "unlike";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as LikeRequest;
    const slug = body.slug?.trim();
    const action = body.action === "unlike" ? "unlike" : "like";

    if (!slug) {
      return Response.json({ error: "Missing slug." }, { status: 400 });
    }

    const delta = action === "unlike" ? -1 : 1;

    const client = await clientPromise;
    const db = client.db("posts");
    const metadata = db.collection("metadata");

    await metadata.updateOne(
      { slug },
      [
        {
          $set: {
            slug,
            likes: {
              $max: [
                {
                  $add: [{ $ifNull: ["$likes", 0] }, delta],
                },
                0,
              ],
            },
          },
        },
      ],
      { upsert: true }
    );

    const updatedPost = await metadata.findOne(
      { slug },
      { projection: { _id: 0, likes: 1 } }
    );
    const rawLikes = updatedPost?.likes ?? 0;
    const likes = Number(rawLikes);

    return Response.json(
      { likes: Number.isFinite(likes) ? likes : 0, action },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Like endpoint error:", error);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
