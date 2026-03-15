import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// ======================================================
// CREATE AXIOS INSTANCE
// ======================================================
// This instance will be used for ALL API calls in the app.
// It centralizes configuration like base URL, headers,
// credentials, and interceptors.

const apiClient = axios.create({
  // Base API URL
  // Uses environment variable if defined
  // Falls back to localhost if not set
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",

  // Default headers sent with every request
  headers: {
    "Content-Type": "application/json",
  },

  // Allows cookies to be sent with requests
  // Needed if backend uses cookie-based auth
  withCredentials: true,

  // Prevent requests from hanging forever
  // 15 seconds timeout
  timeout: 15000,
});


// ======================================================
// REQUEST INTERCEPTOR
// ======================================================
// Runs BEFORE every request is sent to the server.
// Used for:
// - attaching auth tokens
// - debugging
// - modifying request configuration

apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {

    // Routes that DO NOT require authentication
    const publicRoutes = [
      "/login",
      "/refresh-token",
    ];

    // Skip token logic for public routes
    if (
      publicRoutes.some((route) =>
        config.url?.includes(route)
      )
    ) {
      return config;
    }

    // Log request method and endpoint
    console.log(
      "API REQUEST →",
      config.method?.toUpperCase(),
      config.url
    );

    // Safely read token from localStorage
    // Must check window existence because Next.js
    // may run code on server
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    // If token exists attach Authorization header
    if (token) {

      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }

      // Add bearer token
      config.headers.Authorization = `Bearer ${token}`;

      console.log("API REQUEST → token attached");

    } else {
      console.warn("API REQUEST → no token found");
    }

    // Continue request
    return config;
  },

  // Handle request setup errors
  (error: AxiosError) => {
    console.error("API REQUEST ERROR →", error);
    return Promise.reject(error);
  }
);


// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================
// Runs AFTER server sends response.
// Used for:
// - logging responses
// - handling auth errors
// - global error handling

apiClient.interceptors.response.use(

  // Successful response handler
  (response: AxiosResponse) => {

    // Log response status and endpoint
    console.log(
      "API RESPONSE →",
      response.status,
      response.config.url
    );

    // Return response to calling code
    return response;
  },

  // Error response handler
  (error: AxiosError) => {

    // Extract useful debugging info
    const status = error.response?.status;
    const data = error.response?.data;
    const url = error.config?.url;

    // Log structured error
    console.error("API ERROR →", {
      status,
      url,
      data,
    });

    // Handle Unauthorized errors
    // Usually means token expired or invalid
    if (status === 401 && typeof window !== "undefined") {

      console.warn("AUTH ERROR → clearing auth state");

      // Remove token from localStorage
      localStorage.removeItem("access_token");

      // Remove auth cookie if it exists
      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // Redirect user to login page
      window.location.href = "/login";
    }

    // Reject promise so calling code can handle it
    return Promise.reject(error);
  }
);


// ======================================================
// EXPORT API CLIENT
// ======================================================
// This instance should be imported in all service files
// Example:
// import apiClient from "@/services/api-client"

export default apiClient;