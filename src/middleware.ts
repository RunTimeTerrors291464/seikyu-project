import {
  defaultHomePathForRoles,
  userMayAccessPath,
} from "@/lib/auth/authUser";
import {
  ACCESS_TOKEN_COOKIE,
  parseUserRolesCookie,
  USER_ROLES_COOKIE,
} from "@/lib/auth/authCookies";
import { isCashierInvoiceHideEnabled } from "@/lib/config/featureFlags";
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const roles = parseUserRolesCookie(req.cookies.get(USER_ROLES_COOKIE)?.value);
  const cashierInvoiceHide = isCashierInvoiceHideEnabled();

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
      roles.length > 0
        ? defaultHomePathForRoles(roles, cashierInvoiceHide)
        : "/admin/dashboard";
    return NextResponse.redirect(new URL(home, req.url));
  }

  // A role context is required for every protected route. This prevents a
  // missing or malformed client cookie from being treated as unrestricted.
  // The API must still enforce authorization because browser cookies are not
  // a cryptographic source of identity.
  if (token && roles.length === 0 && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && roles.length > 0 && !userMayAccessPath(roles, pathname)) {
    return NextResponse.redirect(
      new URL(defaultHomePathForRoles(roles, cashierInvoiceHide), req.url),
    );
  }

  const isCashierSellingPath =
    pathname === "/cashier/selling" ||
    pathname.startsWith("/cashier/selling/");
  const isCashierNewSellingPath =
    pathname === "/cashier/new-selling" ||
    pathname.startsWith("/cashier/new-selling/");

  if (token && cashierInvoiceHide && isCashierSellingPath) {
    return NextResponse.redirect(new URL("/cashier/new-selling", req.url));
  }

  if (token && !cashierInvoiceHide && isCashierNewSellingPath) {
    return NextResponse.redirect(new URL("/cashier/selling", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
