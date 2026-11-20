import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * Bots shut out of the whole site. Search engines (Googlebot, Bingbot, DuckDuckBot, …) are not listed,
 * so posts and notes still show up in search. robots.txt is a request, not a lock: the companies
 * behind these bots say they honour it, but a scraper that ignores it has to be blocked at the server/CDN.
 */
const BLOCKED_BOTS = [
  // Collect pages to train AI models. Google-Extended and Applebot-Extended only opt out of AI
  // training; normal Google/Apple search indexing is unaffected.
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Meta-ExternalAgent",
  "FacebookBot",
  "Amazonbot",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Diffbot",
  "AI2Bot",
  "Ai2Bot-Dolma",
  "PanguBot",
  "Timpibot",
  "ImagesiftBot",
  "omgili",
  // AI search/answer engines, and fetchers that read a page when someone asks a chatbot about it.
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "MistralAI-User",
  "YouBot",
  "DuckAssistBot",
  // SEO/marketing crawlers: heavy traffic, no benefit to a personal site.
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "DataForSeoBot",
  "PetalBot",
];

/** /robots.txt: search engines may crawl public pages; AI and SEO scrapers may crawl nothing. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/api"] },
      { userAgent: BLOCKED_BOTS, disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
