import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Middleware runs before the request reaches the page
export function middleware(req: NextRequest) {

  // Get access token from cookies (used to check if user is logged in)
  const token = req.cookies.get("access_token")?.value;

  // Check if the request is for dashboard pages
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  // Check if the request is for the login page
  const isLogin = req.nextUrl.pathname.startsWith("/login");

  // If user is NOT logged in and tries to access dashboard
  // → redirect them to login page
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user IS logged in and tries to open login page
  // → redirect them to dashboard
  if (token && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Otherwise allow the request to continue
  return NextResponse.next();
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    "/dashboard/:path*", // apply to all dashboard routes
    "/login",            // apply to login page
  ],
};