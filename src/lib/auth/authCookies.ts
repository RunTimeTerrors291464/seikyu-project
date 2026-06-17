import {
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type UserRoleCode,
} from "@/features/admin/services/adminUsers.service";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const USER_ROLES_COOKIE = "user_roles";

function cookieSecureSuffix(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.protocol === "https:" ? "; Secure" : "";
}

/**
 * @param token - JWT access token for API and middleware auth checks.
 */
export function setAccessTokenCookie(token: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(
    token,
  )}; path=/; SameSite=Lax${cookieSecureSuffix()}`;
}

/**
 * @param roles - Numeric role codes from the signed-in user.
 */
export function setUserRolesCookie(roles: readonly UserRoleCode[]): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${USER_ROLES_COOKIE}=${encodeURIComponent(
    JSON.stringify(roles),
  )}; path=/; SameSite=Lax${cookieSecureSuffix()}`;
}

/** Clears auth cookies used by middleware and SSR redirects. */
export function clearAuthCookies(): void {
  if (typeof document === "undefined") {
    return;
  }

  const expired = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const suffix = cookieSecureSuffix();

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; SameSite=Lax${suffix}${expired}`;
  document.cookie = `${USER_ROLES_COOKIE}=; path=/; SameSite=Lax${suffix}${expired}`;
}

/**
 * @param value - Raw `user_roles` cookie value.
 * @returns Parsed role codes, or an empty array when missing or invalid.
 */
export function parseUserRolesCookie(value: string | undefined): UserRoleCode[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(function isKnownRole(entry): entry is UserRoleCode {
      return (
        entry === USER_ROLE_ADMIN ||
        entry === USER_ROLE_MANAGER ||
        entry === USER_ROLE_CASHIER
      );
    });
  } catch {
    return [];
  }
}
