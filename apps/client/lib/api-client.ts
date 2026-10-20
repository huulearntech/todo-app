import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
} from "axios";
import { getBackendApiUrl } from "./server/config";

const isBackend = (typeof window === "undefined")

export const apiClient: AxiosInstance = axios.create({
  baseURL:
    isBackend
      ? getBackendApiUrl()
      : "/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (!isBackend) {
    config.headers.set(
      "x-timezone",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;

export function _resetQueueState(): void {
  refreshPromise = null;
}

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

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const requestUrl = typeof originalRequest.url === "string" ? originalRequest.url : "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/sign-in") ||
      requestUrl.includes("/auth/sign-up") ||
      requestUrl.includes("/auth/refresh-token");

    if (error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // This is the queue itself. Microtask queue.
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