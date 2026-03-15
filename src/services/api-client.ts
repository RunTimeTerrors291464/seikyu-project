import axios from "axios";

// Create a base Axios instance used for all API requests
export const apiClient = axios.create({
  // Base API URL from environment variable
  // Falls back to localhost if not defined
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",

  // Default headers for every request
  headers: {
    "Content-Type": "application/json",
  },

  // Allows cookies to be sent with requests (important if backend uses cookies)
  withCredentials: true,
});

// Request interceptor
// Runs BEFORE every request is sent
apiClient.interceptors.request.use(
  (config) => {
    // Skip interceptor for login and refresh token requests
    const publicRoutes = ["/login", "/refresh-token"];

    if (publicRoutes.some((route) => config.url?.includes(route))) {
      return config;
    }

    // Log request method and endpoint for debugging
    console.log("API REQUEST →", config.method?.toUpperCase(), config.url);

    // Safely access localStorage only in browser environment
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    // If token exists, attach it to Authorization header
    // This allows backend to authenticate the request
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("API REQUEST → token attached");
    } else {
      // Debug message if token is missing
      console.log("API REQUEST → no token found");
    }

    // Return updated config so request continues
    return config;
  },
  (error) => {
    // Handle request setup errors
    console.error("API REQUEST ERROR →", error);
    return Promise.reject(error);
  }
);

// Response interceptor
// Runs AFTER response is received
apiClient.interceptors.response.use(
  (response) => {
    // Log response status and endpoint
    console.log(
      "API RESPONSE →",
      response.status,
      response.config.url
    );

    // Return response to the calling function
    return response;
  },
  (error) => {
    // Extract useful debug info from error
    const status = error.response?.status;
    const data = error.response?.data;

    // Log structured API error information
    console.error("API ERROR →", {
      status,
      url: error.config?.url,
      data,
    });

    // If backend returns 401 (Unauthorized)
    // this usually means the token expired or is invalid
    if (status === 401 && typeof window !== "undefined") {
      console.warn("AUTH ERROR → clearing auth state");

      // Remove token from localStorage
      localStorage.removeItem("access_token");

      // Remove authentication cookie so middleware also sees logout
      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // Redirect user back to login page
      window.location.href = "/login";
    }

    // Reject promise so calling code can handle the error
    return Promise.reject(error);
  }
);

export default apiClient;