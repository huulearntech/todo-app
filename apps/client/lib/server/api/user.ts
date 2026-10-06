import { cache } from "react";
import { serverFetch } from "../api-client";
import type { UserResponseDto } from "@todo/shared";

/**
 * Fetch the current user on the server.
 * Uses React `cache()` for per-request memoization, ensuring multiple components
 * within the same request lifecycle only trigger a single backend request.
 */
export const getCurrentUser = cache(async (): Promise<UserResponseDto> => {
  return serverFetch<UserResponseDto>("/auth/me");
});
