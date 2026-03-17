import { create } from "zustand";

// User type returned from backend
// Adjust fields if your API returns more properties
interface User {
  id: string;
  username: string;
  role: string;
}

// Auth store state definition
interface AuthState {
  user: User | null;       // current logged-in user
  token: string | null;    // JWT access token

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

  // Called after successful login API request
  login: (token, user) => {

    console.log("AUTH STORE → storing token");

    // Next.js runs on server and client
    // localStorage only exists in browser
    if (typeof window !== "undefined") {

      // Store token so Axios can attach it to API requests
      localStorage.setItem("access_token", token);

      // Store token in cookie for Next.js middleware
      document.cookie = `access_token=${token}; path=/`;
    }

    // Update Zustand state
    set({
      token,
      user,
    });
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
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      window.location.href = "/login";
    }

    // Reset store state
    set({
      token: null,
      user: null,
    });
  },

  // Restore auth state when the app starts
  loadUserFromStorage: () => {

    // Only run in browser
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      console.log("AUTH STORE → no stored token");
      return;
    }

    console.log("AUTH STORE → token loaded from storage");

    // Restore token to Zustand
    set({
      token,
    });
  },
}));