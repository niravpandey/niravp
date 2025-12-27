import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;

  const db = client.db("posts");
  const theaters = await db
    .collection("metadata")
    .find({"status":"published"})
    .limit(10)
    .toArray();

  return Response.json({ theaters });
}
