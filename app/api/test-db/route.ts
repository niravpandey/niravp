// app/api/test-db/route.ts
import clientPromise from "@/lib/mongo";

export async function GET() {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || (await client.db().databaseName);
    const db = client.db(dbName);

    // Simple ping command
    await db.command({ ping: 1 });

    return Response.json({ ok: true, db: dbName });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
