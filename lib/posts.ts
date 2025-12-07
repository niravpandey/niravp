import clientPromise from "@/lib/mongo";

export async function getTopPosts(limit = 4) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "blog");

  const posts = await db
    .collection("posts")
    .aggregate([
      // Sort newest first
      { $sort: { createdAt: -1 } },

      // Only take the top N
      { $limit: limit },

      // Lookup likes where likes.post_id == posts.slug
      {
        $lookup: {
          from: "likes",
          localField: "slug",
          foreignField: "post_id",
          as: "likes_docs",
        },
      },

      // Add a likes field = number of matching like docs
      {
        $addFields: {
          likes: { $size: "$likes_docs" },
        },
      },

      // We don't actually need the full likes_docs array in the result
      {
        $project: {
          likes_docs: 0,
        },
      },
    ])
    .toArray();

  return posts;
}