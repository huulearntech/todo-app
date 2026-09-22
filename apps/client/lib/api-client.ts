import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
} from "axios";

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh-token`,
    {},
    { withCredentials: true },
  );
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