import clientPromise from "@/lib/mongodb";

export type Post = {
  title: string;
  slug: string;
  publishedAt: Date;
  excerpt: string;
  categories: string[];
  readTimeMinutes: number;
  likes: number;
  status?: "draft" | "published";
  createdAt?: Date;
  updatedAt?: Date;
};


export async function GET() {
  const client = await clientPromise;
  const db = client.db("posts");

  const posts = await db
    .collection<Post>("metadata")
    .find({ status: { $ne: "draft" } })
    .sort({ publishedAt: -1 })
    .limit(4)
    .project({
      _id: 0,
      title: 1,
      slug: 1,
      publishedAt: 1,
      excerpt: 1,
      categories: 1,
      readTimeMinutes: 1,
      likes: 1,
    })
    .toArray();

  return Response.json({ posts });
}
