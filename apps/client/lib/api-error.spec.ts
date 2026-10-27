import { describe, it, expect } from "vitest";
import axios, { AxiosError, AxiosHeaders } from "axios";
import {
  normalizeApiError,
  getErrorMessage,
  isConnectionError,
} from "./api-error";

describe("api-error utility", () => {
  it("should extract error message from standard API error response", () => {
    const error = new AxiosError("Request failed with status code 400");
    error.response = {
      status: 400,
      statusText: "Bad Request",
      data: {
        statusCode: 400,
        message: "Email is already taken",
        error: "Bad Request",
        timestamp: "2026-10-27T08:00:00.000Z",
        path: "/api/auth/register",
        correlationId: "trace-abc-123",
      },
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    const normalized = normalizeApiError(error);
    expect(normalized.statusCode).toBe(400);
    expect(normalized.message).toBe("Email is already taken");
    expect(normalized.correlationId).toBe("trace-abc-123");
    expect(normalized.isNetworkError).toBe(false);
    expect(getErrorMessage(error)).toBe("Email is already taken");
  });

  it("should format array messages correctly (e.g. validation error list)", () => {
    const error = new AxiosError("Validation error");
    error.response = {
      status: 400,
      statusText: "Bad Request",
      data: {
        statusCode: 400,
        message: ["Title is required", "Priority must be valid"],
        error: "Bad Request",
        timestamp: "2026-10-27T08:00:00.000Z",
        path: "/api/tasks",
      },
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    const message = getErrorMessage(error);
    expect(message).toBe("Title is required, Priority must be valid");
  });

  it("should detect network disconnection and connection refused errors", () => {
    const networkError = new AxiosError("Network Error", "ERR_NETWORK");
    // No response indicates connection failure
    networkError.response = undefined;

    expect(isConnectionError(networkError)).toBe(true);

    const normalized = normalizeApiError(networkError);
    expect(normalized.isNetworkError).toBe(true);
    expect(normalized.statusCode).toBe(0);
    expect(normalized.message).toContain("Unable to connect to the server");
  });

  it("should detect timeout errors", () => {
    const timeoutError = new AxiosError("timeout of 10000ms exceeded", "ECONNABORTED");
    timeoutError.response = undefined;

    const normalized = normalizeApiError(timeoutError);
    expect(normalized.isTimeout).toBe(true);
    expect(normalized.message).toContain("Request timed out");
  });

  it("should handle native Error instances", () => {
    const nativeError = new Error("Custom JS runtime failure");
    const normalized = normalizeApiError(nativeError);

    expect(normalized.message).toBe("Custom JS runtime failure");
    expect(normalized.statusCode).toBe(500);
    expect(normalized.isNetworkError).toBe(false);
  });

  it("should return fallback for unknown values", () => {
    expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
    expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
  });
});
