import { create } from "zustand";

// User type returned from backend
// Adjust fields if your API returns more properties
interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;       // current logged-in user
  token: string | null;    // JWT access token
  hydrated: boolean;       // has state been restored from storage

  login: (token: string, user: User) => void;
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
  login: (token, user) => {

    console.log("AUTH STORE → storing token");

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

    // Restore token to Zustand
    set((previous) => ({
      ...previous,
      token,
      user: user ? JSON.parse(user) : null,
      hydrated: true,
    }));
  },
}));