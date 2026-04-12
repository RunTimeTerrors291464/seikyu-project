import { ACCENT_STYLES, type Accent } from "@/components/types/ui";
import clsx from "clsx";

import {
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type UserRoleCode,
} from "../services/adminUsers.service";

/**
 * Theme accent for a platform user role (admin / manager / cashier).
 *
 * @param role - Numeric role code from the API.
 * @returns Accent used for filter pills and table role chips.
 */
export function userRoleAccent(role: UserRoleCode): Accent {
  if (role === USER_ROLE_ADMIN) {
    return "danger";
  }
  if (role === USER_ROLE_MANAGER) {
    return "warning";
  }
  if (role === USER_ROLE_CASHIER) {
    return "primary";
  }
  return "neutral";
}

/**
 * Class names for a role filter chip (same visual language as `getFilterPillClassName` options).
 *
 * @param role - Role code for this chip.
 * @param selected - Whether this role is included in the current filter.
 * @returns Tailwind classes for a `button` role filter.
 */
export function userRoleFilterButtonClassName(
  role: UserRoleCode,
  selected: boolean,
): string {
  return clsx(
    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity",
    "cursor-pointer select-none active:translate-y-px",
    selected ? "opacity-100" : "opacity-70 hover:opacity-100",
    ACCENT_STYLES[userRoleAccent(role)],
  );
}

/**
 * Role toggles on the users list filter bar: neutral when off, role accent when on.
 *
 * @param role - Role code for this chip (accent used only when selected).
 * @param selected - Whether this role is part of the filter.
 * @returns Tailwind classes for the filter `button`.
 */
export function userRoleListFilterButtonClassName(
  role: UserRoleCode,
  selected: boolean,
): string {
  if (!selected) {
    return clsx(
      "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
      "cursor-pointer select-none active:translate-y-px",
      "border-border bg-card text-muted hover:bg-hover hover:text-text",
    );
  }

  return userRoleFilterButtonClassName(role, true);
}
