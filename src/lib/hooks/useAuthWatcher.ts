"use client";

import { getTokenExpiryTime } from "@/services/token";
import { useAuthStore } from "@/stores/auth.store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuthWatcher = () => {
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isAuthPage =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password";

    if (!token) {
      if (!isAuthPage) {
        console.log("No token → redirect");
        router.replace("/login");
      }
      return;
    }

    if (token && isAuthPage) {
      router.replace("/dashboard");
      return;
    }

    const expiryTime = getTokenExpiryTime(token);

    if (!expiryTime) {
      logout();
      return;
    }

    const timeout = expiryTime - Date.now();

    if (timeout <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(() => {
      console.log("Token expired → logout");
      logout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [pathname, token, logout, router]);
};