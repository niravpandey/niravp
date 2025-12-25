import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;

  const db = client.db("sample_mflix");
  const theaters = await db
    .collection("theaters")
    .find({})
    .limit(10)
    .toArray();

  return Response.json({ theaters });
}
