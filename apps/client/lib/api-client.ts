import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
} from "axios";
import { getBackendApiUrl } from "./server/config";

export const apiClient: AxiosInstance = axios.create({
  baseURL:
    typeof window === "undefined"
      ? getBackendApiUrl()
      : "/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.headers.set(
      "x-timezone",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const url =
    typeof window === "undefined"
      ? `${getBackendApiUrl()}/auth/refresh-token`
      : "/api/auth/refresh-token";
  await axios.post(url, {}, { withCredentials: true });
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const isRefreshEndpoint =
      typeof originalRequest.url === "string" &&
      originalRequest.url.includes("/auth/refresh-token");

    if (error.response.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        await refreshPromise;

        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);