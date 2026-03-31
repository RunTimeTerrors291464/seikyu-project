"use client";

import { useAuthStore } from "@/stores/auth.store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuthWatcher = () => {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

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
        console.log("No token → redirect to login");
        router.replace("/login");
      }
      return;
    }

    // already logged in → block auth pages
    if (token && isAuthPage) {
      console.log("Already logged in → redirect to dashboard");
      router.replace("/dashboard");
      return;
    }

    // DO NOTHING about expiry
    // axios interceptor handles it
  }, [pathname, token, hydrated, router]);
};