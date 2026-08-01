import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?newsletter=invalid", request.url));
  }

  try {
    // 1. Verify JWT signature
    const secret = process.env.JWT_SECRET || "local-fallback-secret";
    const decoded = jwt.verify(token, secret) as { email: string };

    if (!decoded.email) {
      return NextResponse.redirect(new URL("/?newsletter=invalid", request.url));
    }

    // 2. Write to Supabase matching your EXACT table schema
    const { error } = await supabase.from("subscribers").upsert(
      {
        email: decoded.email,
        verified: true,
        token: token, // Satisfies the NOT NULL & UNIQUE constraint on 'token'
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("❌ Supabase DB Write Error:", error.message);
      return NextResponse.redirect(new URL("/?newsletter=error", request.url));
    }

    console.log("✅ Subscriber verified and written to Supabase:", decoded.email);

    // 3. Success Redirect
    return NextResponse.redirect(new URL("/?newsletter=verified", request.url));
  } catch (err) {
    console.error("❌ JWT Error:", err);
    return NextResponse.redirect(new URL("/?newsletter=expired", request.url));
  }
}