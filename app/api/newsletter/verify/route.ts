import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// Uses standard Supabase client env variables
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
    // 1. Decrypt and verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };

    if (!decoded.email) {
      return NextResponse.redirect(new URL("/?newsletter=invalid", request.url));
    }

    // 2. Commit verified subscriber to Supabase
    const { error } = await supabase.from("subscribers").upsert(
      {
        email: decoded.email,
        verified: true,
        verified_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Supabase write error:", error);
      return NextResponse.redirect(new URL("/?newsletter=error", request.url));
    }

    // 3. Success redirect
    return NextResponse.redirect(new URL("/?newsletter=verified", request.url));
  } catch (err) {
    // Token expired (> 24h) or tampered with
    return NextResponse.redirect(new URL("/?newsletter=expired", request.url));
  }
}