"use client";

import { userMayUseManagerWorkflowControls } from "@/lib/auth/authUser";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Client hook for gating manager-scoped buttons and draft editing.
 *
 * @returns True when the signed-in user has the manager role (not admin-only).
 */
export function useMayUseManagerWorkflowControls(): boolean {
  const roles = useAuthStore((state) => state.user?.roles ?? []);
  return userMayUseManagerWorkflowControls(roles);
}
