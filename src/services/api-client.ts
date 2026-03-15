import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// ======================================================
// AXIOS INSTANCE
// ======================================================

const apiClient = axios.create({
  baseURL:
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") +
    "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});


// ======================================================
// REFRESH TOKEN STATE
// ======================================================

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Add request to queue while refresh is running
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Retry queued requests
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}


// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {

    const publicRoutes = [
      "/login",
      "/refresh-token",
    ];

    const isPublic = publicRoutes.some((route) =>
      config.url?.includes(route)
    );

    if (isPublic) {
      return config;
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "API REQUEST →",
        config.method?.toUpperCase(),
        config.url
      );
    }

    return config;
  },

  (error: AxiosError) => {
    console.error("API REQUEST ERROR →", error);
    return Promise.reject(error);
  }
);


// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

apiClient.interceptors.response.use(

  (response: AxiosResponse) => {

    if (process.env.NODE_ENV === "development") {
      console.log(
        "API RESPONSE →",
        response.status,
        response.config.url
      );
    }

    return response;
  },

  async (error: AxiosError) => {

    const originalRequest: any = error.config;

    const status = error.response?.status;
    const url = originalRequest?.url;

    if (process.env.NODE_ENV === "development") {
      console.error("API ERROR →", {
        status,
        url,
        data: error.response?.data,
      });
    }

    // Routes that should NOT trigger refresh
    const authRoutes = [
      "/login",
      "/refresh-token",
    ];

    const isAuthRoute = authRoutes.some((route) =>
      url?.includes(route)
    );

    // ======================================================
    // TOKEN EXPIRED → REFRESH
    // ======================================================

    if (
      status === 401 &&
      !isAuthRoute &&
      !originalRequest._retry
    ) {

      originalRequest._retry = true;

      // If refresh already running → queue request
      if (isRefreshing) {

        return new Promise((resolve) => {

          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization =
              `Bearer ${token}`;

            resolve(apiClient(originalRequest));
          });

        });

      }

      isRefreshing = true;

      try {

        if (process.env.NODE_ENV === "development") {
          console.warn("TOKEN EXPIRED → refreshing...");
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = response.data.accessToken;

        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", newToken);
        }

        // Retry queued requests
        onRefreshed(newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return apiClient(originalRequest);

      } catch (refreshError) {

        console.warn("REFRESH FAILED → logout");

        if (typeof window !== "undefined") {

          localStorage.removeItem("access_token");

          document.cookie =
            "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

          window.location.href = "/login";
        }

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


// ======================================================
// EXPORT
// ======================================================

export default apiClient;