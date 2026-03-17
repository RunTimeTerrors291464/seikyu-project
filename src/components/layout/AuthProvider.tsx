"use client";

import { useAuthWatcher } from "@/lib/hooks/useAuthWatcher";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadUserFromStorage = useAuthStore(
    (s) => s.loadUserFromStorage
  );

  // Restore auth on first load
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Silent logout logic
  useAuthWatcher();

  return <>{children}</>;
}