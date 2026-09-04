import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminApiRoute = request.nextUrl.pathname.startsWith("/api/admin");

  if (!user && (isAdminRoute || isAdminApiRoute)) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (isAdminRoute || isAdminApiRoute) && !isAdminEmail(user.email)) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/pte/dashboard", request.url));
  }

  if (user && request.nextUrl.pathname === "/login" && isAdminEmail(user.email)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/login"],
};
