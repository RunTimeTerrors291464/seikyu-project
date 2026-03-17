import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const apiClient = axios.create({
  baseURL:
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") +
    "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ===============================
// REFRESH STATE
// ===============================

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ===============================
// REQUEST INTERCEPTOR
// ===============================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => Promise.reject(error)
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {

    const originalRequest =
      error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const status = error.response?.status;

    const authRoutes = [
      "/auth/login",
      "/auth/refresh-token",
    ];

    const isAuthRoute = authRoutes.some((route) =>
      originalRequest?.url?.includes(route)
    );

    // ===============================
    // TOKEN EXPIRED
    // ===============================

    if (status === 401 && !isAuthRoute && !originalRequest._retry) {

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {

        const refreshToken = localStorage.getItem("refresh_token");

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;

        localStorage.setItem("access_token", newAccessToken);

        // sync cookie
        document.cookie = `access_token=${newAccessToken}; path=/`;

        onRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);

      } catch (refreshError) {

        console.warn("Refresh token expired → logout");

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;