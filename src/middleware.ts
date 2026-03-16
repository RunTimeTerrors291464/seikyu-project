import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Middleware runs before the request reaches the page
export function middleware(req: NextRequest) {
  // Get token from cookies
  const token = req.cookies.get("access_token")?.value;

  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isLogin = req.nextUrl.pathname.startsWith("/login");

  // Not logged in → redirect to login
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in → prevent login page
  if (token && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};