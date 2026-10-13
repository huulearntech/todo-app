import { cookies } from "next/headers";
import {
  ApiError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
} from "./errors";
import { getBackendApiUrl } from "./config";

const API_BASE_URL = getBackendApiUrl();

export async function serverFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const cookieList: string[] = [];
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
    cookieList.push(`access_token=${accessToken}`);
  }
  if (refreshToken) {
    cookieList.push(`refresh_token=${refreshToken}`);
  }
  if (cookieList.length > 0) {
    const existing = headers.get("Cookie");
    headers.set(
      "Cookie",
      existing ? `${existing}; ${cookieList.join("; ")}` : cookieList.join("; "),
    );
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      cache: options.cache ?? "no-store",
    });
  } catch (error) {
    throw new ServiceUnavailableError(
      `Failed to connect to backend service at ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error,
    );
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const message =
      typeof errorBody === "object" && errorBody !== null && "message" in errorBody
        ? String((errorBody as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    switch (response.status) {
      case 401:
        throw new UnauthorizedError(message, errorBody);
      case 403:
        throw new ForbiddenError(message, errorBody);
      case 404:
        throw new NotFoundError(message, errorBody);
      case 500:
        throw new InternalServerError(message, errorBody);
      default:
        throw new ApiError(response.status, message, errorBody);
    }
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}
