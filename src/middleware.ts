import {
  defaultHomePathForRoles,
  userMayAccessPath,
} from "@/lib/auth/authUser";
import {
  ACCESS_TOKEN_COOKIE,
  parseUserRolesCookie,
  USER_ROLES_COOKIE,
} from "@/lib/auth/authCookies";
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const roles = parseUserRolesCookie(req.cookies.get(USER_ROLES_COOKIE)?.value);

  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isAuthPage) {
    const home =
      roles.length > 0 ? defaultHomePathForRoles(roles) : "/admin/dashboard";
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (token && roles.length > 0 && !userMayAccessPath(roles, pathname)) {
    return NextResponse.redirect(
      new URL(defaultHomePathForRoles(roles), req.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
