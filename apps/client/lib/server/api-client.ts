import { cookies } from "next/headers";
import {
  ApiError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

export async function serverFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
    const existingCookie = headers.get("Cookie");
    const tokenCookie = `access_token=${accessToken}`;
    headers.set(
      "Cookie",
      existingCookie ? `${existingCookie}; ${tokenCookie}` : tokenCookie,
    );
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

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
