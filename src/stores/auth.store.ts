import { normalizeAuthUser, type AuthUser } from "@/lib/auth/authUser";
import { create } from "zustand";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;

  login: (token: string, user: unknown) => void;
  logout: () => void;

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

    console.log("AUTH STORE → storing token");

    const user = normalizeAuthUser(rawUser);
    if (!user) {
      console.error("AUTH STORE → login payload missing id, username, or roles");
      return;
    }

    // Next.js runs on server and client
    // localStorage only exists in browser
    if (typeof window !== "undefined") {

      // Store token so Axios can attach it to API requests
      localStorage.setItem("access_token", token);

      localStorage.setItem("user", JSON.stringify(user));

      // Store token in cookie for Next.js middleware
      document.cookie = `access_token=${encodeURIComponent(
        token
      )}; path=/; SameSite=Lax${
        window.location.protocol === "https:" ? "; Secure" : ""
      }`;
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
  logout: () => {

    console.log("AUTH STORE → clearing auth");

    if (typeof window !== "undefined") {

      // Remove token used by API client
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      // Delete cookie by expiring it
      document.cookie =
        "access_token=; path=/; SameSite=Lax" +
        (window.location.protocol === "https:" ? "; Secure" : "") +
        "; expires=Thu, 01 Jan 1970 00:00:00 GMT";

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
      console.log("AUTH STORE → no stored token");
      set((previous) => ({
        ...previous,
        token: null,
        user: null,
        hydrated: true,
      }));
      return;
    }

    console.log("AUTH STORE → token loaded from storage");

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
  },
}));