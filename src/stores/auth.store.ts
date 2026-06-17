import { normalizeAuthUser, type AuthUser } from "@/lib/auth/authUser";
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setUserRolesCookie,
} from "@/lib/auth/authCookies";
import { logout as logoutRequest } from "@/services/auth.service";
import { create } from "zustand";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;

  login: (token: string, user: unknown) => void;
  logout: () => Promise<void>;

  // Restores token when app loads (prevents logout on refresh)
  loadUserFromStorage: () => void;
}

// Create Zustand store
export const useAuthStore = create<AuthState>((set) => ({

  // Initial state
  user: null,
  token: null,
  hydrated: false,

  // Called after successful login API request
  login: (token, rawUser) => {
    const user = normalizeAuthUser(rawUser);
    if (!user) {
      return;
    }

    // Next.js runs on server and client
    // localStorage only exists in browser
    if (typeof window !== "undefined") {

      // Store token so Axios can attach it to API requests
      localStorage.setItem("access_token", token);

      localStorage.setItem("user", JSON.stringify(user));

      setAccessTokenCookie(token);
      setUserRolesCookie(user.roles);
    }

    // Update Zustand state
    set((previous) => ({
      ...previous,
      token,
      user,
      hydrated: true,
    }));
  },

  // Clears authentication
  logout: async function logout(): Promise<void> {
    if (typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          await logoutRequest(refreshToken);
        } catch {
          // Clear local auth even when API logout fails.
        }
      }

      // Remove token used by API client
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      clearAuthCookies();

      window.location.href = "/login";
    }

    // Reset store state
    set((previous) => ({
      ...previous,
      token: null,
      user: null,
      hydrated: true,
    }));
  },

  // Restore auth state when the app starts
  loadUserFromStorage: () => {

    // Only run in browser
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");

    if (!token) {
      set((previous) => ({
        ...previous,
        token: null,
        user: null,
        hydrated: true,
      }));
      return;
    }

    let restoredUser: AuthUser | null = null;
    if (user) {
      try {
        restoredUser = normalizeAuthUser(JSON.parse(user));
      } catch {
        restoredUser = null;
      }
    }

    set((previous) => ({
      ...previous,
      token,
      user: restoredUser,
      hydrated: true,
    }));

    setAccessTokenCookie(token);
    if (restoredUser) {
      setUserRolesCookie(restoredUser.roles);
    }
  },
}));