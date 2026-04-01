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
type AxiosLikeError = {
  response?: {
    status?: number;
  };
};

function toAxiosLikeError(error: unknown): AxiosLikeError {
  if (typeof error === "object" && error !== null) {
    return error as AxiosLikeError;
  }

  return {};
}

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
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ API SUCCESS →", {
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    }
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const status = error.response?.status;

    if (process.env.NODE_ENV === "development") {
      console.log("❌ API ERROR →", {
        url: originalRequest?.url,
        method: originalRequest?.method?.toUpperCase(),
        status,
        data: error.response?.data,
        message: error.message,
      });
    }

    const authRoutes = ["/auth/login", "/auth/refresh-token"];

    const isAuthRoute = authRoutes.some((route) =>
      originalRequest?.url?.includes(route)
    );

    // ===============================
    // TOKEN EXPIRED
    // ===============================

    if (status === 401 && !isAuthRoute && !originalRequest._retry) {
      console.warn("🔒 ACCESS TOKEN EXPIRED → attempting refresh");

      originalRequest._retry = true;

      // ⏳ queue requests while refreshing
      if (isRefreshing) {
        console.log("⏳ Already refreshing → queue request");

        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            console.log("🔁 Retrying queued request →", originalRequest.url);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {

        const refreshToken = localStorage.getItem("refresh_token");

        console.log("🔑 Refresh token found:", !!refreshToken);

        if (!refreshToken) {
          console.error("🚫 No refresh token → logout");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        console.log("📡 Calling refresh API...");

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;

        console.log("✅ REFRESH SUCCESS");

        // update storage
        localStorage.setItem("access_token", newAccessToken);

        // sync cookie (used by Next.js middleware)
        document.cookie = `access_token=${encodeURIComponent(
          newAccessToken
        )}; path=/; SameSite=Lax${
          window.location.protocol === "https:" ? "; Secure" : ""
        }`;

        onRefreshed(newAccessToken);

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        console.log("🔁 Retrying original request →", originalRequest.url);

        return apiClient(originalRequest);
      } catch (refreshError: unknown) {
        const axiosLikeError = toAxiosLikeError(refreshError);
        console.error("💥 REFRESH FAILED →", {
          status: axiosLikeError.response?.status,
        });

        console.warn("🚪 Logging out user");

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