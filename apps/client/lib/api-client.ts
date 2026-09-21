import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

type TokenResponse = {
  accessToken: string;
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post<TokenResponse>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh-token`,
    {},
    { withCredentials: true },
  );

  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

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

        const newToken = await refreshPromise;

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);