"use server";

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { compileDigestHtml } from "@/lib/newsletter-compiler";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendDigestNewsletter(postIds: string[], customSubject?: string) {
  if (!postIds || postIds.length === 0) {
    return { success: false, message: "No posts selected." };
  }

  try {
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, title, slug, description, created_at, cover_image")
      .in("id", postIds);

    if (postsError || !posts || posts.length === 0) {
      return { success: false, message: "Failed to fetch selected posts." };
    }

    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("email")
      .eq("verified", true);

    if (subError || !subscribers || subscribers.length === 0) {
      return { success: false, message: "No verified subscribers found." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";
    const subject = customSubject || `Digest: ${posts.map((p) => p.title).slice(0, 2).join(", ")}${posts.length > 2 ? " + more" : ""}`;

    // Send individually so each email gets a personalized unsubscribe link
    let sendCount = 0;
    for (const sub of subscribers) {
      const htmlBody = compileDigestHtml(posts, appUrl, sub.email);
      const unsubUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`;

      await transporter.sendMail({
        from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
        to: sub.email,
        subject,
        text: posts.map((p) => `${p.title}: ${appUrl}/blog/${p.slug}`).join("\n\n"),
        html: htmlBody,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      sendCount++;
    }

    return {
      success: true,
      message: `Digest successfully sent to ${sendCount} subscriber(s)!`,
    };
  } catch (err: any) {
    console.error("Digest error:", err);
    return { success: false, message: err.message || "Failed to send digest." };
  }
}