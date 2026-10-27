import axios, { AxiosError } from "axios";
import type { ApiErrorResponse } from "@todo/shared";

export interface NormalizedError {
  message: string;
  statusCode: number;
  isNetworkError: boolean;
  isTimeout: boolean;
  correlationId?: string;
  errorName?: string;
  details?: Record<string, unknown>;
  raw: unknown;
}

export function isConnectionError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) {
    return false;
  }
  // Axios triggers ERR_NETWORK or has no response when backend is down/offline
  return (
    !err.response &&
    (err.code === "ERR_NETWORK" ||
      err.code === "ECONNREFUSED" ||
      err.code === "ENOTFOUND" ||
      err.message === "Network Error")
  );
}

export function normalizeApiError(
  err: unknown,
  fallback = "An unexpected error occurred",
): NormalizedError {
  if (axios.isAxiosError(err)) {
    const isNetwork = isConnectionError(err);
    const isTimeout =
      err.code === "ECONNABORTED" ||
      Boolean(err.message && err.message.toLowerCase().includes("timeout"));

    const responseData = err.response?.data as ApiErrorResponse | undefined;
    const correlationId =
      (err.response?.headers?.["x-correlation-id"] as string | undefined) ||
      responseData?.correlationId;

    let message = fallback;

    if (isNetwork) {
      message = "Unable to connect to the server. Please check your network connection.";
    } else if (isTimeout) {
      message = "Request timed out. Please try again.";
    } else if (responseData?.message) {
      message = Array.isArray(responseData.message)
        ? responseData.message.join(", ")
        : responseData.message;
    } else if (err.message) {
      message = err.message;
    }

    return {
      message,
      statusCode: err.response?.status ?? (isNetwork ? 0 : 500),
      isNetworkError: isNetwork,
      isTimeout,
      correlationId,
      errorName: responseData?.error ?? err.name,
      details: responseData?.details,
      raw: err,
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message || fallback,
      statusCode: 500,
      isNetworkError: false,
      isTimeout: false,
      errorName: err.name,
      raw: err,
    };
  }

  return {
    message: fallback,
    statusCode: 500,
    isNetworkError: false,
    isTimeout: false,
    raw: err,
  };
}

export function getErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred",
): string {
  return normalizeApiError(err, fallback).message;
}
