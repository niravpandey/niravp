import { NextResponse, type NextRequest } from "next/server";
import { readNewsletterToken } from "@/lib/newsletter-token";
import { createClient } from "@/lib/supabase/server";

type VerifyStatus = "verified" | "invalid" | "error";

/** Confirmation link from the subscribe email: marks the address as a verified subscriber. */
export async function GET(request: NextRequest) {
  const redirectWith = (status: VerifyStatus) => NextResponse.redirect(new URL(`/?newsletter=${status}`, request.url));

  const token = request.nextUrl.searchParams.get("token");
  if (!token) return redirectWith("invalid");

  let email: string | null;
  try {
    email = readNewsletterToken(token, "subscribe");
  } catch (error) {
    console.error("Newsletter verify error:", error);
    return redirectWith("error");
  }
  if (!email) return redirectWith("invalid");

  const supabase = await createClient();
  // The subscribers table requires a unique, non-null token, so the signed token is stored too.
  const { error } = await supabase
    .from("subscribers")
    .upsert({ email, verified: true, token }, { onConflict: "email" });

  if (error) {
    console.error("Newsletter verify error:", error.message);
    return redirectWith("error");
  }

  return redirectWith("verified");
}
