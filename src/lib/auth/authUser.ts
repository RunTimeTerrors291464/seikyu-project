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
  userRoles: readonly UserRoleCode[],
  required: readonly UserRoleCode[],
): boolean {
  if (required.length === 0) {
    return true;
  }

  const set = new Set(userRoles);
  return required.some((code) => set.has(code));
}

/**
 * Whether the user may start a new selling invoice from the cashier sales list.
 * Cashiers and managers may create; admin-only accounts may view the list only.
 *
 * @param roles - Roles from the signed-in user.
 * @returns True when the user has cashier or manager role.
 */
export function userMayCreateSellingInvoice(
  roles: readonly UserRoleCode[],
): boolean {
  return userHasAnyRole(roles, [
    USER_ROLE_CASHIER,
    USER_ROLE_MANAGER,
  ]);
}

/**
 * Whether the user may use manager-only controls (create/save/delete drafts, product status, returns).
 * Admin-only accounts do not get this; assign the manager role in the API for users who need it.
 *
 * @param roles - Roles from the signed-in user.
 * @returns True when the user has the manager role.
 */
export function userMayUseManagerWorkflowControls(
  roles: readonly UserRoleCode[],
): boolean {
  return roles.includes(USER_ROLE_MANAGER);
}

/**
 * Whether the user may view product audit history (admin-only).
 *
 * @param roles - Roles from the signed-in user.
 * @returns True when the user has the admin role.
 */
export function userMayViewProductHistory(
  roles: readonly UserRoleCode[],
): boolean {
  return roles.includes(USER_ROLE_ADMIN);
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

/**
 * Whether the signed-in user may open a route prefix.
 * Admins inherit manager and cashier access for navigation and middleware.
 *
 * @param userRoles - Roles from the signed-in user.
 * @param pathname - Request pathname such as `/manager/invoices/import`.
 * @returns True when the route is unrestricted or the user has the required role.
 */
export function userMayAccessPath(
  userRoles: readonly UserRoleCode[],
  pathname: string,
): boolean {
  const effectiveRoles = effectiveRolesForSidebarNav([...userRoles]);

  if (pathname.startsWith("/admin")) {
    return effectiveRoles.includes(USER_ROLE_ADMIN);
  }

  if (pathname.startsWith("/manager")) {
    return effectiveRoles.includes(USER_ROLE_MANAGER);
  }

  if (pathname.startsWith("/cashier")) {
    return effectiveRoles.includes(USER_ROLE_CASHIER);
  }

  return true;
}
