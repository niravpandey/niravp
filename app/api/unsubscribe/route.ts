import { NextResponse, type NextRequest } from "next/server";
import { readNewsletterToken } from "@/lib/newsletter-token";
import { createClient } from "@/lib/supabase/server";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function confirmationPage(email: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribed</title>
    <style>
      body {
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #fafafa;
        color: #18181b;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
      }
      .card {
        background: #ffffff;
        padding: 32px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      h1 { font-size: 20px; font-weight: 600; color: #1e3a8a; margin-top: 0; }
      p { font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
      a { font-size: 13px; color: #826d84; text-decoration: none; font-weight: 500; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>You've been unsubscribed</h1>
      <p><strong>${escapeHtml(email)}</strong> will no longer receive newsletter broadcasts.</p>
      <a href="/">&larr; Return to website</a>
    </div>
  </body>
</html>`;
}

/** Unsubscribe link from newsletter emails. Only signed tokens are accepted, so nobody can unsubscribe someone else. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Unsubscribe token missing." }, { status: 400 });
  }

  let email: string | null;
  try {
    email = readNewsletterToken(token, "unsubscribe");
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }
  if (!email) {
    return NextResponse.json({ error: "Invalid unsubscribe token." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscribers").update({ verified: false }).eq("email", email);

  if (error) {
    console.error("Unsubscribe error:", error.message);
    return NextResponse.json({ error: "Failed to update subscription status." }, { status: 500 });
  }

  return new NextResponse(confirmationPage(email), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
