import {
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type UserRoleCode,
} from "@/features/admin/services/adminUsers.service";

export type AuthUser = {
  id: string;
  username: string;
  roles: UserRoleCode[];
};

const VALID_ROLE_CODES = new Set<UserRoleCode>([
  USER_ROLE_ADMIN,
  USER_ROLE_MANAGER,
  USER_ROLE_CASHIER,
]);

/**
 * Returns true when `value` is a known platform role code from the API.
 *
 * @param value - Numeric candidate from JSON or parsing.
 * @returns Whether `value` is 1, 2, or 3 (admin, manager, cashier).
 */
function isUserRoleCode(value: number): value is UserRoleCode {
  return VALID_ROLE_CODES.has(value as UserRoleCode);
}

const LEGACY_ROLE_STRING_TO_CODE: Record<string, UserRoleCode> = {
  ADMIN: USER_ROLE_ADMIN,
  MANAGER: USER_ROLE_MANAGER,
  CASHIER: USER_ROLE_CASHIER,
  "1": USER_ROLE_ADMIN,
  "2": USER_ROLE_MANAGER,
  "3": USER_ROLE_CASHIER,
};

/**
 * Normalizes login / stored user JSON into `AuthUser` with a `roles` array.
 * Accepts API shape `{ roles: number[] }` or legacy `{ role: string | number }`.
 *
 * @param raw - Parsed JSON or unknown value from storage/API.
 * @returns Normalized user, or null when required fields are missing or invalid.
 */
export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = record.id != null ? String(record.id) : "";
  const username = record.username != null ? String(record.username) : "";

  if (!id || !username) {
    return null;
  }

  const roles: UserRoleCode[] = [];

  if (Array.isArray(record.roles)) {
    for (const entry of record.roles) {
      const numeric =
        typeof entry === "number" ? entry : Number(entry);
      if (Number.isFinite(numeric) && isUserRoleCode(numeric)) {
        roles.push(numeric);
      }
    }
  }

  if (roles.length === 0 && record.role !== undefined) {
    if (typeof record.role === "number" && isUserRoleCode(record.role)) {
      roles.push(record.role);
    } else if (typeof record.role === "string") {
      const upper = record.role.trim().toUpperCase();
      const mapped =
        LEGACY_ROLE_STRING_TO_CODE[upper] ??
        LEGACY_ROLE_STRING_TO_CODE[record.role.trim()];
      if (mapped !== undefined) {
        roles.push(mapped);
      }
    }
  }

  return { id, username, roles };
}

/**
 * Expands roles for sidebar visibility: admins can open every area of the app.
 *
 * @param userRoles - Roles from the signed-in user.
 * @returns Role set to use when filtering nav groups.
 */
export function effectiveRolesForSidebarNav(
  userRoles: UserRoleCode[],
): UserRoleCode[] {
  if (userRoles.includes(USER_ROLE_ADMIN)) {
    return [
      USER_ROLE_ADMIN,
      USER_ROLE_MANAGER,
      USER_ROLE_CASHIER,
    ];
  }

  return userRoles;
}

/**
 * Returns true if the user has at least one of the required roles.
 *
 * @param userRoles - Roles from the signed-in user.
 * @param required - Role codes allowed to see a nav section; empty means no access rule (caller should treat separately).
 * @returns Whether any required role is present on the user.
 */
export function userHasAnyRole(
  userRoles: UserRoleCode[],
  required: readonly UserRoleCode[],
): boolean {
  if (required.length === 0) {
    return true;
  }

  const set = new Set(userRoles);
  return required.some((code) => set.has(code));
}

/**
 * First app route to open after login when the user is on an auth page.
 * Prefers admin, then manager, then cashier.
 *
 * @param roles - Role codes for the signed-in user.
 * @returns Default home path inside the app shell.
 */
export function defaultHomePathForRoles(roles: UserRoleCode[]): string {
  if (roles.includes(USER_ROLE_ADMIN)) {
    return "/admin/dashboard";
  }

  if (roles.includes(USER_ROLE_MANAGER)) {
    return "/manager/product-inventory";
  }

  if (roles.includes(USER_ROLE_CASHIER)) {
    return "/cashier/selling";
  }

  return "/admin/dashboard";
}
