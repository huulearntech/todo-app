import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
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

interface QueuedRequest {
  resolve: (value: AxiosResponse) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown): void => {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      apiClient(item.config)
        .then((response) => item.resolve(response))
        .catch((err: unknown) => item.reject(err));
    }
  });
  failedQueue = [];
};

/**
 * Reset queue state (exported for test isolation)
 */
export function _resetQueueState(): void {
  isRefreshing = false;
  failedQueue = [];
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

    // SSR Guard: Token refresh queue and rotation only run in browser context
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    const isExcludedEndpoint =
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/auth/sign-in");

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isExcludedEndpoint
    ) {
      originalRequest._retry = true;

      const retryPromise = new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });

      if (!isRefreshing) {
        isRefreshing = true;

        refreshAccessToken()
          .then(() => {
            processQueue(null);
          })
          .catch((refreshError: unknown) => {
            processQueue(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      return retryPromise;
    }

    return Promise.reject(error);
  },
);