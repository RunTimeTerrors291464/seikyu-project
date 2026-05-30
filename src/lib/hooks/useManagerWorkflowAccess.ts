"use client";

import type { UserRoleCode } from "@/features/admin/services/adminUsers.service";
import {
  userMayCreateSellingInvoice,
  userMayUseManagerWorkflowControls,
} from "@/lib/auth/authUser";
import { useAuthStore } from "@/stores/auth.store";

/** Stable fallback when `user` or `roles` is missing; avoids `[]` in selectors (new ref → subscribe loop). */
const EMPTY_ROLES: readonly UserRoleCode[] = [];

/**
 * Client hook for gating manager-scoped buttons and draft editing.
 *
 * @returns True when the signed-in user has the manager role (not admin-only).
 */
export function useMayUseManagerWorkflowControls(): boolean {
  const roles = useAuthStore((state) => state.user?.roles ?? EMPTY_ROLES);
  return userMayUseManagerWorkflowControls(roles);
}

/**
 * Client hook for starting a sale from the cashier selling list.
 *
 * @returns True for cashier or manager (not admin-only).
 */
export function useMayCreateSellingInvoice(): boolean {
  const roles = useAuthStore((state) => state.user?.roles ?? EMPTY_ROLES);
  return userMayCreateSellingInvoice(roles);
}
