"use client";

import { defaultHomePathForRoles } from "@/lib/auth/authUser";
import { useFeatureFlags } from "@/lib/config/FeatureFlagsProvider";
import { useAuthStore } from "@/stores/auth.store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuthWatcher = () => {
  const { cashierInvoiceHide } = useFeatureFlags();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const authUser = useAuthStore((s) => s.user);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const isAuthPage =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password";

    // no token → go login
    if (!token) {
      if (!isAuthPage) {
        router.replace("/login");
      }
      return;
    }

    // already logged in → leave auth pages for role-appropriate home
    if (token && isAuthPage) {
      const home =
        authUser?.roles?.length != null && authUser.roles.length > 0
          ? defaultHomePathForRoles(authUser.roles, cashierInvoiceHide)
          : "/admin/dashboard";
      router.replace(home);
      return;
    }

    // DO NOTHING about expiry
    // axios interceptor handles it
  }, [pathname, token, hydrated, router, authUser, cashierInvoiceHide]);
};
