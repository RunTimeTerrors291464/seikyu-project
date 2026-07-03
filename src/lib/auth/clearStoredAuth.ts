import { clearAuthCookies } from "@/lib/auth/authCookies";

const AUTH_STORAGE_KEYS = ["access_token", "refresh_token", "user"] as const;

/** Clears client auth storage and cookies so middleware allows `/login`. */
export function clearStoredAuth(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  clearAuthCookies();
}
