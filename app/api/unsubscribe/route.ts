import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  if (!email) {
    return NextResponse.json({ error: "Email parameter missing." }, { status: 400 });
  }

  try {
    // Flip verified to false in Supabase subscribers table
    const { error } = await supabase
      .from("subscribers")
      .update({ verified: false })
      .eq("email", email);

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.json({ error: "Failed to update subscription status." }, { status: 500 });
    }

    // Redirect to a confirmed page (or return simple HTML)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed</title>
          <style>
            body {
              font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            <p><strong>${email}</strong> will no longer receive newsletter broadcasts.</p>
            <a href="${appUrl}">&larr; Return to website</a>
          </div>
        </body>
      </html>
      `,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Server error during unsubscribe." }, { status: 500 });
  }
}