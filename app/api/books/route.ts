import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

type Book = {
  title: string;
  author: string;
  link: string;
  cover_image: string | null;
};

export async function GET() {
  const user_id = process.env.GOODREADS_USER_ID;
  if (!user_id) return NextResponse.json({ error: "Goodreads user ID not set" }, { status: 500 });

  try {
    const url = `https://www.goodreads.com/user/updates_rss/${user_id}`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    const currentlyReading: Book[] = [];

    feed.items.forEach((entry) => {
      const content = entry.content || entry.contentSnippet || "";
      const descriptionText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      const match = descriptionText.match(/is currently reading ['"]?(.+?)['"]? by (.+)/i);
      if (!match) return;

      let cover_image: string | null = null;
      const imgMatch = content.match(/<img.*?src="(.*?)"/);
      if (imgMatch) {
        cover_image = imgMatch[1]
          .replace(/_SX\d+_SY\d+_/, "_SX1500_SY1500_")
          .replace(/_SY\d+_/, "_SX1500_SY1500_")
          .replace(/_SX\d+_/, "_SX1500_SY1500_")
          .replace(".jpg", "._SX1000_SY1500_.jpg");
      }

      currentlyReading.push({
        title: match[1],
        author: match[2],
        link: entry.link || "",
        cover_image,
      });
    });

    return NextResponse.json(currentlyReading);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch Goodreads feed" }, { status: 500 });
  }
}
