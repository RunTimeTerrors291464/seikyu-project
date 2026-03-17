"use client";

import { getTokenExpiryTime } from "@/services/token";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect } from "react";

export const useAuthWatcher = () => {
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      logout();
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

    console.log("Auto logout scheduled in:", timeout);

    const timer = setTimeout(() => {
      console.log("Token expired → auto logout");
      logout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [logout]);
};