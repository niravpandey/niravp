// app/api/seed-posts/route.ts
import clientPromise from "@/lib/mongo";
import { NextResponse } from "next/server";

const blogCards = [
  {
    title: "How AI is Transforming Finance",
    slug: "ai-finance",
    date: "Dec 3, 2025",
    excerpt:
      "AI and machine learning are reshaping the financial world. Learn how algorithms are changing trading, risk management, and customer services.",
    categories: ["AI", "Finance"],
    readTime: "6 min read",
  },
  {
    title: "Building Modern Web Apps with Next.js",
    slug: "nextjs-web-apps",
    date: "Nov 20, 2025",
    excerpt:
      "Step-by-step guide to creating scalable web applications with Next.js, TailwindCSS, and framer-motion for modern interactive UI.",
    categories: ["Web Development", "Next.js"],
    readTime: "8 min read",
  },
  {
    title: "Exploring Data Science in the Real World",
    slug: "data-science-real-world",
    date: "Oct 15, 2025",
    excerpt:
      "Discover how data science techniques are applied across industries, from healthcare to finance, for impactful decision-making.",
    categories: ["Data Science", "Analytics"],
    readTime: "7 min read",
  },
  {
    title: "Machine Learning Models You Should Know",
    slug: "ml-models",
    date: "Sep 30, 2025",
    excerpt:
      "An overview of essential machine learning models including supervised, unsupervised, and reinforcement learning approaches.",
    categories: ["Machine Learning", "AI"],
    readTime: "9 min read",
  },
];

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "blog");

    // add a dummy content field so the [slug] page has something to render
    const docs = blogCards.map((card) => ({
      ...card,
      content: `# ${card.title}\n\n${card.excerpt}\n\n(Write full content here later.)`,
      createdAt: new Date(),
    }));

    await db.collection("posts").deleteMany({}); // optional: clear existing
    await db.collection("posts").insertMany(docs);

    return NextResponse.json({ ok: true, inserted: docs.length });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
