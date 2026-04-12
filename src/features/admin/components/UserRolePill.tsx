"use client";

import IconPill from "@/components/ui/IconPill";
import type { Dictionary } from "@/lib/lang/i18n";
import { ClipboardList, type LucideIcon, Shield, Store } from "lucide-react";

import { userRoleAccent } from "../lib/userRolePillStyles";
import {
  USER_ROLE_ADMIN,
  USER_ROLE_MANAGER,
  type UserRoleCode,
} from "../services/adminUsers.service";

type UserRolePillProps = {
  role: UserRoleCode;
  dict: Dictionary;
};

/**
 * Resolves the Lucide icon for a user role pill.
 *
 * @param role - API role code.
 * @returns Icon component for `IconPill`.
 */
function roleIconForCode(role: UserRoleCode): LucideIcon {
  if (role === USER_ROLE_ADMIN) {
    return Shield;
  }
  if (role === USER_ROLE_MANAGER) {
    return ClipboardList;
  }
  return Store;
}

/**
 * Localized label for a user role.
 *
 * @param dict - UI strings.
 * @param role - API role code.
 * @returns Short role name.
 */
function roleLabel(dict: Dictionary, role: UserRoleCode): string {
  if (role === USER_ROLE_ADMIN) {
    return dict.admin;
  }
  if (role === USER_ROLE_MANAGER) {
    return dict.manager;
  }
  return dict.cashier;
}

/**
 * Read-only colored pill for one user role (table cell), aligned with filter chip accents.
 *
 * @param role - Role to display.
 * @param dict - UI strings for the role label.
 */
export default function UserRolePill({ role, dict }: UserRolePillProps) {
  const Icon = roleIconForCode(role);

  return (
    <span className="inline-flex transition-opacity hover:opacity-90">
      <IconPill
        icon={Icon}
        accent={userRoleAccent(role)}
        label={roleLabel(dict, role)}
      />
    </span>
  );
}
