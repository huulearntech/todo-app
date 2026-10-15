import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { apiClient, _resetQueueState } from "./api-client";

describe("apiClient 401 Job Queue", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
    _resetQueueState();
  });

  afterEach(() => {
    _resetQueueState();
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  const createAxiosError = (status: number, config: InternalAxiosRequestConfig): AxiosError => {
    const error = new AxiosError(
      `Request failed with status code ${status}`,
      status === 401 ? "ERR_BAD_REQUEST" : "ERR_BAD_RESPONSE",
      config,
      {},
      {
        status,
        statusText: status === 401 ? "Unauthorized" : "Error",
        headers: {},
        config,
        data: { message: "Unauthorized" },
      },
    );
    return error;
  };

  it("should immediately reject 401 on the server (SSR)", async () => {
    // Ensure window is undefined (SSR)
    delete (globalThis as { window?: unknown }).window;

    const postSpy = vi.spyOn(axios, "post");

    apiClient.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw createAxiosError(401, config);
    });

    await expect(apiClient.get("/tasks/me")).rejects.toThrow();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("should refresh token and retry a single failed 401 request in the browser", async () => {
    (globalThis as { window?: unknown }).window = {} as unknown as Window & typeof globalThis;

    const refreshPostSpy = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { message: "refreshed" } });

    let callCount = 0;
    apiClient.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      callCount++;
      if (callCount === 1) {
        throw createAxiosError(401, config);
      }
      return {
        data: [{ id: "task-1", title: "Task 1" }],
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      } as AxiosResponse;
    });

    const response = await apiClient.get<Array<{ id: string; title: string }>>("/tasks/me");

    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
    expect(refreshPostSpy).toHaveBeenCalledWith(
      "/api/auth/refresh-token",
      {},
      { withCredentials: true },
    );
    expect(callCount).toBe(2);
    expect(response.data).toEqual([{ id: "task-1", title: "Task 1" }]);
  });

  it("should queue multiple parallel 401 requests, send only 1 refresh, and resolve all retries", async () => {
    (globalThis as { window?: unknown }).window = {} as unknown as Window & typeof globalThis;

    // Simulate refresh taking 50ms to ensure concurrent requests arrive while isRefreshing is true
    const refreshPostSpy = vi.spyOn(axios, "post").mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { data: { message: "refreshed" } };
    });

    const attempts: Record<string, number> = {};

    apiClient.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      const url = config.url ?? "";
      attempts[url] = (attempts[url] ?? 0) + 1;

      if (attempts[url] === 1) {
        throw createAxiosError(401, config);
      }

      return {
        data: { success: true, url, attempt: attempts[url] },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      } as AxiosResponse;
    });

    const [res1, res2, res3] = await Promise.all([
      apiClient.get<{ success: boolean; url: string; attempt: number }>("/tasks/me"),
      apiClient.get<{ success: boolean; url: string; attempt: number }>("/projects/me"),
      apiClient.get<{ success: boolean; url: string; attempt: number }>("/users/me"),
    ]);

    // Exactly 1 refresh call despite 3 concurrent 401s
    expect(refreshPostSpy).toHaveBeenCalledTimes(1);

    // All three requests succeeded on retry
    expect(res1.data.success).toBe(true);
    expect(res2.data.success).toBe(true);
    expect(res3.data.success).toBe(true);

    // Each endpoint was called twice: 1st failed with 401, 2nd succeeded after refresh
    expect(attempts["/tasks/me"]).toBe(2);
    expect(attempts["/projects/me"]).toBe(2);
    expect(attempts["/users/me"]).toBe(2);
  });

  it("should reject all queued requests when token refresh fails", async () => {
    (globalThis as { window?: unknown }).window = {} as unknown as Window & typeof globalThis;

    const refreshError = new Error("Refresh token expired");
    vi.spyOn(axios, "post").mockRejectedValueOnce(refreshError);

    apiClient.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw createAxiosError(401, config);
    });

    const promise1 = apiClient.get("/tasks/me");
    const promise2 = apiClient.get("/projects/me");

    await expect(promise1).rejects.toThrow("Refresh token expired");
    await expect(promise2).rejects.toThrow("Refresh token expired");
  });

  it("should not retry endpoints like /auth/sign-in or /auth/refresh-token on 401", async () => {
    (globalThis as { window?: unknown }).window = {} as unknown as Window & typeof globalThis;

    const refreshPostSpy = vi.spyOn(axios, "post");

    apiClient.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw createAxiosError(401, config);
    });

    await expect(apiClient.post("/auth/sign-in", { email: "a@b.com" })).rejects.toThrow();
    await expect(apiClient.post("/auth/refresh-token")).rejects.toThrow();

    // No refresh attempts should be triggered for auth endpoints
    expect(refreshPostSpy).not.toHaveBeenCalled();
  });

  it("should not loop infinitely if retried request still returns 401", async () => {
    (globalThis as { window?: unknown }).window = {} as unknown as Window & typeof globalThis;

    const refreshPostSpy = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { message: "refreshed" } });

    let callCount = 0;
    apiClient.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      callCount++;
      // Always fails with 401
      throw createAxiosError(401, config);
    });

    await expect(apiClient.get("/tasks/me")).rejects.toThrow();

    // Refresh was called once for the first attempt
    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
    // Request was attempted initially, then retried once, then rejected (no infinite loop)
    expect(callCount).toBe(2);
  });
});
